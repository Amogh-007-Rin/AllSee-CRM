
import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { OrgType, LicenseStatus } from '@prisma/client';

export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const { orgId, orgType } = req.user!;

    let deviceWhereInput = {};

    if (orgType === OrgType.PARENT) {
      // Parent: Get all devices from own org AND child orgs
      // First, find all child org IDs
      const childOrgs = await prisma.organization.findMany({
        where: { parentId: orgId },
        select: { id: true },
      });
      
      const allOrgIds = [orgId, ...childOrgs.map(o => o.id)];
      
      deviceWhereInput = {
        organizationId: { in: allOrgIds }
      };
    } else {
      // Child: Get only own devices
      deviceWhereInput = {
        organizationId: orgId
      };
    }

    // Fetch device counts
    const [active, expiringSoon, expired, suspended] = await Promise.all([
      prisma.device.count({ where: { ...deviceWhereInput, status: LicenseStatus.ACTIVE } }),
      prisma.device.count({ where: { ...deviceWhereInput, status: LicenseStatus.EXPIRING_SOON } }),
      prisma.device.count({ where: { ...deviceWhereInput, status: LicenseStatus.EXPIRED } }),
      prisma.device.count({ where: { ...deviceWhereInput, status: LicenseStatus.SUSPENDED } }),
    ]);

    // Fetch timeline data (Expiring in next 6 months)
    // For now, let's group by month of expiry date for the timeline
    // Note: Prisma doesn't support complex group by date functions natively in all dbs easily without raw query,
    // but for small dataset we can fetch upcoming expiries and process in JS.
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    
    const upcomingExpiries = await prisma.device.findMany({
      where: {
        ...deviceWhereInput,
        expiryDate: {
          gte: new Date(),
          lte: sixMonthsFromNow,
        },
      },
      select: {
        expiryDate: true,
      },
    });

    // Process for timeline (Month Name -> Count)
    const timelineMap = new Map<string, number>();
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    upcomingExpiries.forEach(device => {
      const date = new Date(device.expiryDate);
      const month = monthNames[date.getMonth()];
      const key = `${month} ${date.getFullYear()}`; // Include year to avoid collision
      timelineMap.set(key, (timelineMap.get(key) || 0) + 1);
    });

    const timeline = Array.from(timelineMap.entries()).map(([month, count]) => ({
      month,
      count
    }));

    res.json({
      summary: {
        active,
        warning: expiringSoon,
        critical: expired + suspended,
        suspended: suspended,
        expired: expired
      },
      timeline
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getDevices = async (req: AuthRequest, res: Response) => {
  try {
    const { orgId, orgType } = req.user!;
    let deviceWhereInput = {};

    if (orgType === OrgType.PARENT) {
      const childOrgs = await prisma.organization.findMany({
        where: { parentId: orgId },
        select: { id: true },
      });
      const allOrgIds = [orgId, ...childOrgs.map(o => o.id)];
      deviceWhereInput = { organizationId: { in: allOrgIds } };
    } else {
      deviceWhereInput = { organizationId: orgId };
    }

    const devices = await prisma.device.findMany({
      where: deviceWhereInput,
      include: { organization: { select: { name: true } } },
      orderBy: { expiryDate: 'asc' }
    });

    // Check for active renewal requests (created in the last 6 hours)
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    
    const pendingRequests = await prisma.renewalRequest.findMany({
      where: {
        status: 'PENDING',
        createdAt: { gt: sixHoursAgo },
      },
      select: { deviceIds: true }
    });

    const pendingDeviceIds = new Set<string>();
    pendingRequests.forEach(req => {
        req.deviceIds.forEach(id => pendingDeviceIds.add(id));
    });

    const devicesWithFlag = devices.map(device => ({
        ...device,
        activeRenewalRequest: pendingDeviceIds.has(device.id)
    }));

    res.json(devicesWithFlag);
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
