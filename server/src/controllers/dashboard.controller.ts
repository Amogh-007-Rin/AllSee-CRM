
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
    } else if (orgType === OrgType.RESELLER) {
      // Reseller: Get all devices from Client Orgs AND their children
      const clients = await prisma.organization.findMany({
        where: { resellerId: orgId },
        select: { id: true }
      });
      const clientIds = clients.map(c => c.id);

      const childOrgs = await prisma.organization.findMany({
        where: { parentId: { in: clientIds } },
        select: { id: true }
      });

      const allManagedOrgIds = [...clientIds, ...childOrgs.map(c => c.id)];
      
      deviceWhereInput = {
        organizationId: { in: allManagedOrgIds }
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

    if (orgType === OrgType.RESELLER) {
      // Allow reseller to filter by specific client if requested, or see all
      // For now, let's just give them everything or if they passed ?clientId=...
      const clientId = req.query.clientId as string;
      
      if (clientId) {
        // Verify this client belongs to reseller
        const client = await prisma.organization.findFirst({
          where: { id: clientId, resellerId: orgId }
        });
        
        if (client) {
           // Get client and its children
           const children = await prisma.organization.findMany({
             where: { parentId: clientId },
             select: { id: true }
           });
           deviceWhereInput = {
             organizationId: { in: [clientId, ...children.map(c => c.id)] }
           };
        } else {
           // Invalid client access
           return res.json([]); 
        }
      } else {
        // Show all managed devices
        const clients = await prisma.organization.findMany({
            where: { resellerId: orgId },
            select: { id: true }
        });
        const clientIds = clients.map(c => c.id);

        const childOrgs = await prisma.organization.findMany({
            where: { parentId: { in: clientIds } },
            select: { id: true }
        });

        const allManagedOrgIds = [...clientIds, ...childOrgs.map(c => c.id)];
        
        deviceWhereInput = {
            organizationId: { in: allManagedOrgIds }
        };
      }
    } else if (orgType === OrgType.PARENT) {
      // ... existing parent logic ...
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
    console.error('Fetch devices error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getResellerClients = async (req: AuthRequest, res: Response) => {
  try {
    const { orgId, orgType } = req.user!;

    if (orgType !== OrgType.RESELLER) {
      return res.status(403).json({ message: 'Only Resellers can access this.' });
    }

    const clients = await prisma.organization.findMany({
      where: { resellerId: orgId },
      include: {
        children: { select: { id: true } }
      }
    });

    const clientStats = await Promise.all(clients.map(async (client) => {
      // Get all org IDs related to this client (client itself + its children)
      const allOrgIds = [client.id, ...client.children.map(c => c.id)];

      const [totalScreens, atRisk] = await Promise.all([
        prisma.device.count({ where: { organizationId: { in: allOrgIds } } }),
        prisma.device.count({
          where: {
            organizationId: { in: allOrgIds },
            status: { in: [LicenseStatus.EXPIRING_SOON, LicenseStatus.EXPIRED] }
          }
        })
      ]);

      return {
        id: client.id,
        name: client.name,
        totalScreens,
        atRisk
      };
    }));

    res.json(clientStats);
  } catch (error) {
    console.error('Get reseller clients error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
