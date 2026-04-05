import { Router } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { createHash } from "crypto";
import prisma from "../lib/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";
import { logAiSecurityEvent } from "../security/security-logger.js";
import { 
  validateUploadedFile, 
  generateSecureStoragePath,
  documentRateLimiter 
} from "../security/file-validation.js";

const router: Router = Router();

// Create secure upload directory structure
const uploadDir = process.env.UPLOAD_DIR ?? path.resolve(process.cwd(), "uploads");

// Security-hardened multer configuration
const secureStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      // Generate org-scoped directory
      const orgPath = path.join(uploadDir, req.auth?.organizationId || 'temp');
      await fs.mkdir(orgPath, { recursive: true });
      cb(null, orgPath);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    // Temporary filename - will be moved to secure path after validation
    const tempName = `temp-${Date.now()}-${Math.round(Math.random() * 1e9)}.upload`;
    cb(null, tempName);
  }
});

const upload = multer({
  storage: secureStorage,
  limits: { 
    fileSize: 5 * 1024 * 1024,  // 5MB max
    files: 1                     // Single file only
  },
  fileFilter: (req, file, cb) => {
    // Basic pre-validation - real validation happens after upload
    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.txt', '.csv', '.docx', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File extension ${ext} not allowed`));
    }
  }
});

// Apply rate limiting specifically to upload endpoints
const uploadRateLimit = rateLimit(documentRateLimiter);

/**
 * Secure document upload with comprehensive validation
 * POST /api/documents/upload
 */
router.post(
  "/upload",
  uploadRateLimit,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const tempFile = req.file;
    
    if (!tempFile) {
      res.status(400).json({ error: "File is required" });
      return;
    }

    const { propertyId, leaseId, type, name } = req.body as {
      propertyId?: string;
      leaseId?: string;
      type?: string;
      name?: string;
    };

    let finalPath: string | null = null;

    try {
      // Step 1: Validate property ownership (if specified)
      if (propertyId) {
        const property = await prisma.property.findFirst({
          where: { 
            id: propertyId, 
            organizationId: req.auth!.organizationId,
            archivedAt: null  // No uploads to archived properties
          }
        });
        
        if (!property) {
          await cleanupTempFile(tempFile.path);
          res.status(404).json({ error: "Property not found or archived" });
          return;
        }
      }

      // Step 2: Security validation
      const validation = await validateUploadedFile(tempFile);
      if (!validation.valid) {
        await cleanupTempFile(tempFile.path);
        
        // Log security event for blocked upload
        logAiSecurityEvent({
          userId: req.auth!.userId,
          organizationId: req.auth!.organizationId,
          type: "file_upload_blocked",
          severity: "medium",
          message: `File upload blocked: ${validation.error}`,
          metadata: {
            filename: tempFile.originalname,
            mimeType: tempFile.mimetype,
            size: tempFile.size,
            propertyId
          }
        });

        res.status(400).json({ error: validation.error });
        return;
      }

      // Step 3: Move to secure, org-isolated path
      const securePath = generateSecureStoragePath(
        req.auth!.organizationId,
        propertyId || null,
        validation.sanitizedFilename
      );
      
      finalPath = path.join(uploadDir, securePath);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(finalPath), { recursive: true });
      
      // Atomic move to final location
      await fs.rename(tempFile.path, finalPath);

      // Step 4: Store in database
      const document = await prisma.document.create({
        data: {
          userId: req.auth!.userId,
          organizationId: req.auth!.organizationId,
          propertyId: propertyId || undefined,
          leaseId: leaseId || undefined,
          type: resolveDocType(type) as "LEASE" | "RECEIPT" | "INSPECTION" | "INSURANCE" | "TAX" | "OTHER",
          name: name || validation.sanitizedFilename,
          url: `/${securePath}` // Relative path for serving
        }
      });

      // Step 5: Basic text extraction for search (if text file)
      let extractedText: string | null = null;
      if (tempFile.mimetype.startsWith("text/")) {
        try {
          const buffer = await fs.readFile(finalPath);
          extractedText = buffer.toString("utf8").trim().slice(0, 5000);
        } catch {
          // Text extraction failed - non-critical
          extractedText = null;
        }
      }

      // Step 6: Create AI insight if text extracted
      let insightId: string | null = null;
      if (extractedText) {
        const insight = await prisma.aIInsight.create({
          data: {
            userId: req.auth!.userId,
            organizationId: req.auth!.organizationId,
            propertyId: propertyId || undefined,
            type: "DOCUMENT_OCR", 
            input: { documentId: document.id, name: document.name },
            output: { text: extractedText },
            confidence: 0.6,
            reasoning: "Basic text extraction from uploaded document."
          }
        });
        insightId = insight.id;
      }

      // Step 7: Security audit log
      logAiSecurityEvent({
        userId: req.auth!.userId,
        organizationId: req.auth!.organizationId,
        type: "file_upload_success",
        severity: "low",
        message: `Document uploaded successfully`,
        metadata: {
          documentId: document.id,
          filename: document.name,
          mimeType: tempFile.mimetype,
          size: tempFile.size,
          propertyId,
          hasTextContent: !!extractedText
        }
      });

      res.status(201).json({
        document: {
          id: document.id,
          name: document.name,
          type: document.type,
          url: document.url,
          createdAt: document.createdAt
        },
        ocr: extractedText ? {
          insightId,
          text: extractedText
        } : null
      });

    } catch (error) {
      // Cleanup on any error
      if (tempFile?.path) {
        await cleanupTempFile(tempFile.path);
      }
      if (finalPath) {
        await cleanupTempFile(finalPath);
      }

      // Security log for failed upload
      logAiSecurityEvent({
        userId: req.auth?.userId || null,
        organizationId: req.auth?.organizationId || null,
        type: "file_upload_error",
        severity: "medium",
        message: `Document upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          filename: tempFile?.originalname,
          mimeType: tempFile?.mimetype,
          size: tempFile?.size,
          propertyId
        }
      });

      throw error;
    }
  })
);

/**
 * Generate pre-signed URL for secure file access
 * GET /api/documents/:id/url
 */
router.get(
  "/:id/url",
  uploadRateLimit, // Rate limit URL generation
  asyncHandler(async (req, res) => {
    const document = await prisma.document.findFirst({
      where: { 
        id: req.params.id, 
        organizationId: req.auth!.organizationId 
      }
    });

    if (!document) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    // Generate short-lived pre-signed URL
    const token = generateDocumentAccessToken(document.id, req.auth!.userId);
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours

    // Store token for validation
    await prisma.aiSecurityEvent.create({
      data: {
        userId: req.auth!.userId,
        organizationId: req.auth!.organizationId,
        type: "document_access_token",
        severity: "low",
        message: `Pre-signed URL generated for document ${document.name}`,
        metadata: {
          documentId: document.id,
          expiresAt: expiresAt.toISOString(),
          tokenHash: createHash('sha256').update(token).digest('hex')
        }
      }
    });

    res.json({
      url: `/api/documents/${document.id}/download?token=${token}`,
      expiresAt
    });
  })
);

// Utility functions
const resolveDocType = (value?: string) => {
  const allowedTypes = ["LEASE", "RECEIPT", "INSPECTION", "INSURANCE", "TAX", "OTHER"];
  if (!value) return "OTHER";
  const normalized = value.toUpperCase();
  return allowedTypes.includes(normalized) ? normalized : "OTHER";
};

const cleanupTempFile = async (filePath: string) => {
  try {
    await fs.unlink(filePath);
  } catch {
    // File might not exist - ignore
  }
};

const generateDocumentAccessToken = (documentId: string, userId: string): string => {
  const payload = `${documentId}:${userId}:${Date.now()}`;
  return createHash('sha256').update(payload).digest('hex');
};

export default router;