import { Router } from "express";
import prisma from "../lib/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendError } from "../utils/api-error.js";
import { Prisma, ServiceCategory } from "@prisma/client";

const router: Router = Router();

// Helper function to validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to validate phone format (basic validation)
const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
  return phoneRegex.test(phone);
};

// Helper function to validate service categories
const isValidServiceCategory = (category: string): category is ServiceCategory => {
  return Object.values(ServiceCategory).includes(category as ServiceCategory);
};

// GET /vendors - List all vendors with optional filtering
router.get(
  "/vendors",
  asyncHandler(async (req, res) => {
    const { serviceCategory, isActive } = req.query as {
      serviceCategory?: string;
      isActive?: string;
    };

    // Build where clause for filtering
    const whereClause: Prisma.VendorWhereInput = {
      organizationId: req.auth!.organizationId,
    };

    // Filter by service category if provided
    if (serviceCategory && serviceCategory !== "all") {
      if (!isValidServiceCategory(serviceCategory)) {
        sendError(res, 400, "VALIDATION_ERROR", "Invalid service category");
        return;
      }
      whereClause.serviceCategories = {
        has: serviceCategory as ServiceCategory
      };
    }

    // Filter by active status if provided
    if (isActive !== undefined) {
      whereClause.isActive = isActive === "true";
    }

    const vendors = await prisma.vendor.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            maintenanceRequests: true
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    });

    // Transform response to include maintenance request count
    const vendorsWithCounts = vendors.map(({ _count, ...vendor }) => ({
      ...vendor,
      maintenanceRequestCount: _count.maintenanceRequests
    }));

    res.json(vendorsWithCounts);
  })
);

// POST /vendors - Create new vendor
router.post(
  "/vendors",
  asyncHandler(async (req, res) => {
    const {
      name,
      email,
      phone,
      serviceCategories,
      trade
    } = req.body as {
      name?: string;
      email?: string;
      phone?: string;
      serviceCategories?: string[];
      trade?: string;
    };

    // Validate required fields
    if (!name || name.trim().length === 0) {
      sendError(res, 400, "VALIDATION_ERROR", "Vendor name is required");
      return;
    }

    if (!serviceCategories || !Array.isArray(serviceCategories) || serviceCategories.length === 0) {
      sendError(res, 400, "VALIDATION_ERROR", "At least one service category is required");
      return;
    }

    // Validate email format if provided
    if (email && !isValidEmail(email)) {
      sendError(res, 400, "VALIDATION_ERROR", "Invalid email format");
      return;
    }

    // Validate phone format if provided
    if (phone && !isValidPhone(phone)) {
      sendError(res, 400, "VALIDATION_ERROR", "Invalid phone format");
      return;
    }

    // Validate service categories
    for (const category of serviceCategories) {
      if (!isValidServiceCategory(category)) {
        sendError(res, 400, "VALIDATION_ERROR", `Invalid service category: ${category}`);
        return;
      }
    }

    // Check for duplicate vendor by name within organization
    const existingVendor = await prisma.vendor.findFirst({
      where: {
        organizationId: req.auth!.organizationId,
        name: name.trim(),
        isActive: true
      }
    });

    if (existingVendor) {
      sendError(res, 409, "DUPLICATE_VENDOR", "Vendor with this name already exists");
      return;
    }

    // Check for duplicate email within organization
    if (email) {
      const existingEmailVendor = await prisma.vendor.findFirst({
        where: {
          organizationId: req.auth!.organizationId,
          email: email.toLowerCase(),
          isActive: true
        }
      });

      if (existingEmailVendor) {
        sendError(res, 409, "DUPLICATE_EMAIL", "Vendor with this email already exists");
        return;
      }
    }

    const vendor = await prisma.vendor.create({
      data: {
        userId: req.auth!.userId,
        organizationId: req.auth!.organizationId,
        name: name.trim(),
        email: email?.toLowerCase() || null,
        phone: phone?.trim() || null,
        serviceCategories: serviceCategories as ServiceCategory[],
        trade: trade?.trim() || null,
        isActive: true
      },
      include: {
        _count: {
          select: {
            maintenanceRequests: true
          }
        }
      }
    });

    const { _count, ...vendorData } = vendor;
    res.status(201).json({
      ...vendorData,
      maintenanceRequestCount: _count.maintenanceRequests
    });
  })
);

// GET /vendors/:id - Get vendor details
router.get(
  "/vendors/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const vendor = await prisma.vendor.findFirst({
      where: {
        id,
        organizationId: req.auth!.organizationId
      },
      include: {
        _count: {
          select: {
            maintenanceRequests: true
          }
        },
        maintenanceRequests: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            property: {
              select: {
                id: true,
                name: true
              }
            },
            unit: {
              select: {
                id: true,
                label: true
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          },
          take: 5 // Show recent 5 maintenance requests
        }
      }
    });

    if (!vendor) {
      sendError(res, 404, "VENDOR_NOT_FOUND", "Vendor not found");
      return;
    }

    const { _count, ...vendorData } = vendor;
    res.json({
      ...vendorData,
      maintenanceRequestCount: _count.maintenanceRequests
    });
  })
);

// PATCH /vendors/:id - Update vendor information
router.patch(
  "/vendors/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      serviceCategories,
      trade,
      isActive
    } = req.body as {
      name?: string;
      email?: string;
      phone?: string;
      serviceCategories?: string[];
      trade?: string;
      isActive?: boolean;
    };

    // Check if vendor exists and belongs to organization
    const existingVendor = await prisma.vendor.findFirst({
      where: {
        id,
        organizationId: req.auth!.organizationId
      }
    });

    if (!existingVendor) {
      sendError(res, 404, "VENDOR_NOT_FOUND", "Vendor not found");
      return;
    }

    // Validate name if provided
    if (name !== undefined && name.trim().length === 0) {
      sendError(res, 400, "VALIDATION_ERROR", "Vendor name cannot be empty");
      return;
    }

    // Validate email if provided
    if (email !== undefined && email !== "" && !isValidEmail(email)) {
      sendError(res, 400, "VALIDATION_ERROR", "Invalid email format");
      return;
    }

    // Validate phone if provided
    if (phone !== undefined && phone !== "" && !isValidPhone(phone)) {
      sendError(res, 400, "VALIDATION_ERROR", "Invalid phone format");
      return;
    }

    // Validate service categories if provided
    if (serviceCategories !== undefined) {
      if (!Array.isArray(serviceCategories) || serviceCategories.length === 0) {
        sendError(res, 400, "VALIDATION_ERROR", "At least one service category is required");
        return;
      }

      for (const category of serviceCategories) {
        if (!isValidServiceCategory(category)) {
          sendError(res, 400, "VALIDATION_ERROR", `Invalid service category: ${category}`);
          return;
        }
      }
    }

    // Check for duplicates if name or email is being updated
    if (name && name.trim() !== existingVendor.name) {
      const duplicateNameVendor = await prisma.vendor.findFirst({
        where: {
          organizationId: req.auth!.organizationId,
          name: name.trim(),
          isActive: true,
          NOT: { id }
        }
      });

      if (duplicateNameVendor) {
        sendError(res, 409, "DUPLICATE_VENDOR", "Vendor with this name already exists");
        return;
      }
    }

    if (email && email.toLowerCase() !== existingVendor.email) {
      const duplicateEmailVendor = await prisma.vendor.findFirst({
        where: {
          organizationId: req.auth!.organizationId,
          email: email.toLowerCase(),
          isActive: true,
          NOT: { id }
        }
      });

      if (duplicateEmailVendor) {
        sendError(res, 409, "DUPLICATE_EMAIL", "Vendor with this email already exists");
        return;
      }
    }

    const updatedVendor = await prisma.vendor.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(email !== undefined && { email: email ? email.toLowerCase() : null }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(serviceCategories !== undefined && { serviceCategories: serviceCategories as ServiceCategory[] }),
        ...(trade !== undefined && { trade: trade?.trim() || null }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        _count: {
          select: {
            maintenanceRequests: true
          }
        }
      }
    });

    const { _count, ...vendorData } = updatedVendor;
    res.json({
      ...vendorData,
      maintenanceRequestCount: _count.maintenanceRequests
    });
  })
);

// DELETE /vendors/:id - Delete vendor with safety checks
router.delete(
  "/vendors/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if vendor exists and belongs to organization
    const vendor = await prisma.vendor.findFirst({
      where: {
        id,
        organizationId: req.auth!.organizationId
      },
      include: {
        _count: {
          select: {
            maintenanceRequests: {
              where: {
                status: {
                  in: ["PENDING", "IN_PROGRESS"]
                }
              }
            }
          }
        }
      }
    });

    if (!vendor) {
      sendError(res, 404, "VENDOR_NOT_FOUND", "Vendor not found");
      return;
    }

    // Check if vendor has active maintenance requests
    if (vendor._count.maintenanceRequests > 0) {
      sendError(
        res,
        409,
        "ACTIVE_ASSIGNMENTS",
        "Cannot delete vendor with active maintenance requests. Please complete or reassign them first."
      );
      return;
    }

    // Soft delete by setting isActive to false instead of hard delete
    await prisma.vendor.update({
      where: { id },
      data: { isActive: false }
    });

    res.status(204).send();
  })
);

export default router;