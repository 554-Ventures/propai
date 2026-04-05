import { Router } from "express";
import prisma from "../lib/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";
import { requireOrgRole } from "../middleware/roles.js";
import { logAiSecurityEvent } from "../security/security-logger.js";
import { sanitizeUserInput } from "../security/sanitize.js";

const router: Router = Router();

// POST /api/properties/:id/archive
router.post(
  "/:id/archive",
  requireOrgRole(["OWNER", "ADMIN"]), // Only owners/admins can archive
  asyncHandler(async (req, res) => {
    const propertyId = req.params.id;
    const { reason } = req.body;
    const now = new Date();
    
    // Validate property exists and is not already archived
    const property = await prisma.property.findFirst({
      where: { 
        id: propertyId, 
        organizationId: req.auth!.organizationId,
        archivedAt: null  // Not already archived
      },
      include: {
        units: {
          where: { archivedAt: null },
          include: {
            leases: {
              where: { status: "ACTIVE" }
            }
          }
        }
      }
    });

    if (!property) {
      res.status(404).json({ error: "Property not found or already archived" });
      return;
    }

    // Security check: Block archiving properties with active leases
    const activeLeases = property.units.flatMap(unit => unit.leases);
    const hasActiveLeases = activeLeases.length > 0;
    
    if (hasActiveLeases) {
      res.status(400).json({ 
        error: "ACTIVE_LEASES_EXIST", 
        message: "Cannot archive property with active leases",
        details: {
          activeLeaseCount: activeLeases.length,
          leases: activeLeases.map(l => ({ id: l.id }))
        }
      });
      return;
    }

    // Sanitize user input for audit log
    const sanitizedReason = reason ? sanitizeUserInput(reason, 500).sanitized : null;

    try {
      // Archive property and all its units atomically
      await prisma.$transaction(async (tx) => {
        // Archive the property
        const archivedProperty = await tx.property.update({
          where: { id: propertyId },
          data: { archivedAt: now }
        });

        // Archive all units
        const archivedUnits = await tx.unit.updateMany({
          where: { 
            propertyId: propertyId,
            archivedAt: null 
          },
          data: { archivedAt: now }
        });

        return { archivedProperty, archivedUnits };
      });

      // Audit logging using existing AiActionLog pattern
      await prisma.aiActionLog.create({
        data: {
          userId: req.auth!.userId,
          organizationId: req.auth!.organizationId,
          actionType: "property_archive",
          status: "completed",
          payload: {
            propertyId: property.id,
            propertyName: property.name,
            reason: sanitizedReason,
            unitCount: property.units.length
          },
          result: {
            archivedAt: now.toISOString(),
            affectedUnits: property.units.map(u => u.id)
          }
        }
      });

      // Security event for sensitive operation
      logAiSecurityEvent({
        userId: req.auth!.userId,
        organizationId: req.auth!.organizationId,
        type: "property_archived",
        severity: "low",
        message: `Property ${property.name} archived`,
        metadata: {
          propertyId: property.id,
          unitCount: property.units.length,
          reason: sanitizedReason
        }
      });

      res.json({
        id: property.id,
        archivedAt: now
      });

    } catch (error) {
      // Log failed archive attempt
      await prisma.aiActionLog.create({
        data: {
          userId: req.auth!.userId,
          organizationId: req.auth!.organizationId,
          actionType: "property_archive",
          status: "failed",
          payload: {
            propertyId: property.id,
            propertyName: property.name,
            reason: sanitizedReason
          },
          error: error instanceof Error ? error.message : "Unknown error"
        }
      });

      throw error;
    }
  })
);

// POST /api/properties/:id/unarchive
router.post(
  "/:id/unarchive", 
  requireOrgRole(["OWNER", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const propertyId = req.params.id;
    const { reason } = req.body;

    // Validate property exists and is archived
    const property = await prisma.property.findFirst({
      where: { 
        id: propertyId, 
        organizationId: req.auth!.organizationId,
        archivedAt: { not: null }  // Must be archived
      },
      include: {
        units: {
          where: { archivedAt: { not: null } }
        }
      }
    });

    if (!property) {
      res.status(404).json({ error: "Archived property not found" });
      return;
    }

    const sanitizedReason = reason ? sanitizeUserInput(reason, 500).sanitized : null;

    try {
      // Unarchive atomically
      await prisma.$transaction(async (tx) => {
        await tx.property.update({
          where: { id: propertyId },
          data: { archivedAt: null }
        });

        await tx.unit.updateMany({
          where: { 
            propertyId: propertyId,
            archivedAt: { not: null }
          },
          data: { archivedAt: null }
        });
      });

      // Audit logging
      await prisma.aiActionLog.create({
        data: {
          userId: req.auth!.userId,
          organizationId: req.auth!.organizationId,
          actionType: "property_unarchive",
          status: "completed",
          payload: {
            propertyId: property.id,
            propertyName: property.name,
            reason: sanitizedReason,
            unitCount: property.units.length
          },
          result: {
            archivedAt: null,
            restoredUnits: property.units.map(u => u.id)
          }
        }
      });

      logAiSecurityEvent({
        userId: req.auth!.userId,
        organizationId: req.auth!.organizationId,
        type: "property_unarchived",
        severity: "low",
        message: `Property ${property.name} restored from archive`,
        metadata: {
          propertyId: property.id,
          unitCount: property.units.length,
          reason: sanitizedReason
        }
      });

      res.json({
        id: property.id,
        archivedAt: null
      });

    } catch (error) {
      // Log failed unarchive attempt  
      await prisma.aiActionLog.create({
        data: {
          userId: req.auth!.userId,
          organizationId: req.auth!.organizationId,
          actionType: "property_unarchive", 
          status: "failed",
          payload: {
            propertyId: property.id,
            propertyName: property.name,
            reason: sanitizedReason
          },
          error: error instanceof Error ? error.message : "Unknown error"
        }
      });

      throw error;
    }
  })
);

export default router;