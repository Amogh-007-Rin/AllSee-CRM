
import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { OrgType, RequestStatus, LicenseStatus } from '@prisma/client';

// Child Only: Create a Request
export const createRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { orgId, orgType } = req.user!;
    const { notes, deviceIds } = req.body;

    if (orgType === OrgType.PARENT) {
      return res.status(403).json({ message: 'Only Child Organizations can request renewals.' });
    }

    const request = await prisma.renewalRequest.create({
      data: {
        requesterOrgId: orgId,
        notes: notes,
        deviceIds: deviceIds && Array.isArray(deviceIds) && deviceIds.length > 0 ? (deviceIds as any) : undefined,
        status: RequestStatus.PENDING
      }
    });

    res.status(201).json(request);
  } catch (error) {
    console.error('Create request error:', error);
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

    // Find all requests from children of this parent
    // Prisma Relation: Request -> RequesterOrg -> Parent (must be me)
    const requests = await prisma.renewalRequest.findMany({
      where: {
        requesterOrg: {
          parentId: orgId
        }
      },
      include: {
        requesterOrg: {
          select: { name: true }
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
            status: { in: targetStatus }
        };

        // If the request specified particular device IDs, target only those
        if (request.deviceIds && request.deviceIds.length > 0) {
            whereClause.id = { in: request.deviceIds };
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
