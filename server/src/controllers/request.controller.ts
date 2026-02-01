
import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { OrgType, RequestStatus, LicenseStatus } from '@prisma/client';

// Child or Reseller-Managed Parent: Create a Request
export const createRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { orgId, orgType } = req.user!;
    const { notes, deviceIds } = req.body;

    // Allow CHILD to request PARENT
    // Allow PARENT (if reseller managed) to request RESELLER
    // We check if it's a PARENT with billingMode RESELLER_ONLY or explicitly has a resellerId
    if (orgType === OrgType.PARENT) {
      const org = await prisma.organization.findUnique({ where: { id: orgId } });
      if (org?.billingMode !== 'RESELLER_ONLY' && !org?.resellerId) {
         return res.status(403).json({ message: 'Only Child Organizations or Reseller-Managed Parents can request renewals.' });
      }
    }

    const request = await prisma.renewalRequest.create({
      data: {
        requesterOrgId: orgId,
        notes: notes,
        deviceIds: deviceIds && Array.isArray(deviceIds) ? (deviceIds as any) : [],
        status: RequestStatus.PENDING
      }
    });

    res.status(201).json(request);
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reseller Only: Get Requests from Managed Clients
export const getResellerRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { orgId, orgType } = req.user!;

    if (orgType !== OrgType.RESELLER) {
      return res.status(403).json({ message: 'Only Resellers can view these requests.' });
    }

    const requests = await prisma.renewalRequest.findMany({
      where: {
        requesterOrg: {
          resellerId: orgId
        },
        status: RequestStatus.PENDING
      },
      select: {
        id: true,
        createdAt: true,
        status: true,
        notes: true,
        requesterOrgId: true,
        deviceIds: true,
        responseMessage: true,
        respondedAt: true,
        // Exclude quotePdfData
        requesterOrg: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(requests);
  } catch (error) {
    console.error('Get reseller requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Parent Only: Get All Requests
export const getRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { orgId, orgType } = req.user!;

    if (orgType !== OrgType.PARENT) {
      return res.status(403).json({ message: 'Only Parent Organizations can view requests.' });
    }

    // Find requests from children (where I am parent) OR requests from myself (to reseller)
    const requests = await prisma.renewalRequest.findMany({
      where: {
        OR: [
          { requesterOrg: { parentId: orgId } },
          { requesterOrgId: orgId }
        ]
      },
      select: {
        id: true,
        createdAt: true,
        status: true,
        notes: true,
        requesterOrgId: true,
        deviceIds: true,
        responseMessage: true,
        respondedAt: true,
        // Exclude quotePdfData
        requesterOrg: {
          select: { name: true, type: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(requests);
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reseller Only: Respond to Request (Send Quote)
export const respondToRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { orgId, orgType } = req.user!;
    const { id } = req.params;
    const { pdfData, message } = req.body; // pdfData is Base64 string

    if (orgType !== OrgType.RESELLER) {
      return res.status(403).json({ message: 'Only Resellers can respond to requests.' });
    }

    // 1. Validate Request
    const request = await prisma.renewalRequest.findUnique({
      where: { id: id as string },
      include: { requesterOrg: true }
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if Reseller manages this client
    if (request.requesterOrg.resellerId !== orgId) {
      return res.status(403).json({ message: 'You do not manage this organization.' });
    }

    // Update Request
    const updatedRequest = await prisma.renewalRequest.update({
      where: { id: id as string },
      data: {
        status: RequestStatus.QUOTED,
        quotePdfData: pdfData,
        responseMessage: message,
        respondedAt: new Date()
      }
    });

    res.json(updatedRequest);
  } catch (error) {
    console.error('Respond to request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Parent/Child: Download Quote PDF
export const getQuotePdf = async (req: AuthRequest, res: Response) => {
  try {
    const { orgId, orgType } = req.user!;
    const { id } = req.params;

    const request = await prisma.renewalRequest.findUnique({
      where: { id: id as string },
      select: {
        id: true,
        requesterOrgId: true,
        requesterOrg: {
           select: { parentId: true, resellerId: true }
        },
        quotePdfData: true
      }
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (!request.quotePdfData) {
      return res.status(404).json({ message: 'No quote PDF available for this request.' });
    }

    // Authorization:
    // 1. If I am the requester (Child or Parent)
    if (request.requesterOrgId === orgId) {
      return res.json({ pdfData: request.quotePdfData });
    }

    // 2. If I am the Parent of the requester
    if (orgType === OrgType.PARENT && request.requesterOrg.parentId === orgId) {
      return res.json({ pdfData: request.quotePdfData });
    }

    // 3. If I am the Reseller of the requester (Creator of the quote)
    if (orgType === OrgType.RESELLER && request.requesterOrg.resellerId === orgId) {
      return res.json({ pdfData: request.quotePdfData });
    }

    return res.status(403).json({ message: 'Not authorized to view this quote.' });

  } catch (error) {
    console.error('Get quote PDF error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Parent Only: Approve & Pay
export const approveRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { orgId, orgType } = req.user!;
    const { id } = req.params;

    if (orgType !== OrgType.PARENT) {
      return res.status(403).json({ message: 'Only Parent Organizations can approve requests.' });
    }

    // 1. Validate Request
    const request = await prisma.renewalRequest.findUnique({
      where: { id: id as string },
      include: { requesterOrg: true }
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if requesterOrg is loaded
    if (!request.requesterOrg) {
       return res.status(500).json({ message: 'Requester Organization data missing.' });
    }

    if (request.requesterOrg.parentId !== orgId) {
      return res.status(403).json({ message: 'You do not manage this organization.' });
    }

    if (request.status !== RequestStatus.PENDING) {
      return res.status(400).json({ message: 'Request is already processed.' });
    }

    // 2. Perform "Payment" and Renewal Logic
    // In a real app, Stripe/Payment gateway logic goes here.
    // For this prototype, we assume payment success.

    // Logic: Renew ALL devices for the requester org? 
    // The spec says: "Updates device expiryDate + 1 Year. Closes the Request ticket."
    // Usually a request might be specific, but for simplicity let's renew 
    // all devices that are NOT Active (i.e., Expiring Soon, Expired, Suspended)
    // OR simply extend everything by 1 year.
    // Let's target: Expiring Soon, Expired, Suspended.
    
    const targetStatus = [LicenseStatus.EXPIRING_SOON, LicenseStatus.EXPIRED, LicenseStatus.SUSPENDED];

    // Transaction to ensure data integrity
    await prisma.$transaction(async (tx) => {
        // A. Update Request Status
        await tx.renewalRequest.update({
            where: { id: id as string },
            data: { status: RequestStatus.APPROVED }
        });

        // B. Find devices to renew
        const whereClause: any = {
            organizationId: request.requesterOrgId,
        };

        // If the request specified particular device IDs, target only those
        // And allow renewing them even if they are currently ACTIVE (e.g. early renewal)
        if (request.deviceIds && request.deviceIds.length > 0) {
            whereClause.id = { in: request.deviceIds };
        } else {
            // Otherwise, target only devices that NEED renewal
            whereClause.status = { in: targetStatus };
        }

        const devicesToRenew = await tx.device.findMany({ where: whereClause });

        // C. Update each device
        const today = new Date();
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(today.getFullYear() + 1);

        for (const device of devicesToRenew) {
            let newExpiry = new Date(device.expiryDate);
            
            if (device.status === LicenseStatus.EXPIRED || device.status === LicenseStatus.SUSPENDED) {
                newExpiry = new Date(oneYearFromNow);
            } else {
                newExpiry.setFullYear(newExpiry.getFullYear() + 1);
            }

            await tx.device.update({
                where: { id: device.id },
                data: {
                    status: LicenseStatus.ACTIVE,
                    expiryDate: newExpiry,
                    graceTokenExpiry: null
                }
            });
        }
    });

    res.json({ message: 'Request approved and licenses renewed.' });

  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Parent Only: Reject
export const rejectRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { orgId, orgType } = req.user!;
    const { id } = req.params;

    if (orgType !== OrgType.PARENT) {
      return res.status(403).json({ message: 'Only Parent Organizations can reject requests.' });
    }

    // 1. Validate Request
    const request = await prisma.renewalRequest.findUnique({
      where: { id: id as string },
      include: { requesterOrg: true }
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if requesterOrg is loaded
    if (!request.requesterOrg) {
       return res.status(500).json({ message: 'Requester Organization data missing.' });
    }

    if (request.requesterOrg.parentId !== orgId) {
      return res.status(403).json({ message: 'You do not manage this organization.' });
    }

    if (request.status !== RequestStatus.PENDING) {
      return res.status(400).json({ message: 'Request is already processed.' });
    }

    await prisma.renewalRequest.update({
      where: { id: id as string },
      data: { status: RequestStatus.REJECTED }
    });

    res.json({ message: 'Request rejected.' });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
