import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { OrgType, LicenseStatus } from '@prisma/client';

// Parent or Reseller - Bulk renew selected devices by number of years (default 1)
export const bulkRenew = async (req: AuthRequest, res: Response) => {
  try {
    const { orgId, orgType } = req.user!;
    const { deviceIds, years = 1 } = req.body;

    if (orgType !== OrgType.PARENT && orgType !== OrgType.RESELLER) {
      return res.status(403).json({ message: 'Permission denied.' });
    }

    if (!Array.isArray(deviceIds) || deviceIds.length === 0) {
      return res.status(400).json({ message: 'deviceIds array is required.' });
    }

    const updated: any[] = [];

    await prisma.$transaction(async (tx) => {
      // Pre-fetch valid org IDs for security check
      let validOrgIds: string[] = [];
      if (orgType === OrgType.PARENT) {
         const childOrgs = await tx.organization.findMany({ where: { parentId: orgId }, select: { id: true } });
         validOrgIds = [orgId, ...childOrgs.map(o => o.id)];
      } else if (orgType === OrgType.RESELLER) {
         const clients = await tx.organization.findMany({ where: { resellerId: orgId }, select: { id: true } });
         const clientIds = clients.map(c => c.id);
         const children = await tx.organization.findMany({ where: { parentId: { in: clientIds } }, select: { id: true } });
         validOrgIds = [...clientIds, ...children.map(c => c.id)];
      }

      for (const rawId of deviceIds) {
        const id = String(rawId);
        const device = await tx.device.findUnique({ where: { id } });
        if (!device) continue;
        
        // Security Check
        if (!validOrgIds.includes(device.organizationId)) continue;

        const expiry = new Date(device.expiryDate);
        expiry.setFullYear(expiry.getFullYear() + Number(years));

        const u = await tx.device.update({ where: { id }, data: { expiryDate: expiry, status: LicenseStatus.ACTIVE, graceTokenExpiry: null } });
        updated.push(u);
      }
    });

    res.json({ updatedCount: updated.length, updated });
  } catch (error) {
    console.error('Bulk renew error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Parent only - Co-term (align selected devices to a target date)
export const coTerm = async (req: AuthRequest, res: Response) => {
  try {
    const { orgId, orgType } = req.user!;
    const { deviceIds, targetDate } = req.body; // targetDate ISO string

    if (orgType !== OrgType.PARENT) {
      return res.status(403).json({ message: 'Only Parent Organizations can co-term devices.' });
    }

    if (!Array.isArray(deviceIds) || deviceIds.length === 0) {
      return res.status(400).json({ message: 'deviceIds array is required.' });
    }

    const target = targetDate ? new Date(targetDate) : (() => {
      // Default: align to end of current year
      const d = new Date();
      d.setMonth(11);
      d.setDate(31);
      d.setHours(23, 59, 59, 999);
      return d;
    })();

    const updated: any[] = [];

    await prisma.$transaction(async (tx) => {
      for (const rawId of deviceIds) {
        const id = String(rawId);
        const device = await tx.device.findUnique({ where: { id } });
        if (!device) continue;
        // Ensure device belongs to one of parent's orgs
        const org = await tx.organization.findFirst({ where: { id: device.organizationId, parentId: orgId } });
        if (!org && device.organizationId !== orgId) continue;

        const u = await tx.device.update({ where: { id }, data: { expiryDate: target, status: LicenseStatus.ACTIVE, graceTokenExpiry: null } });
        updated.push(u);
      }
    });

    res.json({ updatedCount: updated.length, updated });
  } catch (error) {
    console.error('Co-term error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Parent only - Issue a 7-day grace token to a device
export const issueGraceToken = async (req: AuthRequest, res: Response) => {
  try {
    const { orgId, orgType } = req.user!;
    const id = String(req.params.id);

    if (orgType !== OrgType.PARENT) {
      return res.status(403).json({ message: 'Only Parent Organizations can issue grace tokens.' });
    }

    const device = await prisma.device.findUnique({ where: { id } });
    if (!device) return res.status(404).json({ message: 'Device not found' });

    // Ensure device belongs to parent's hierarchy
    const org = await prisma.organization.findFirst({ where: { id: device.organizationId, parentId: orgId } });
    if (!org && device.organizationId !== orgId) return res.status(403).json({ message: 'You do not manage this device.' });

    // BUG FIX: Only allow grace token for EXPIRED devices
    if (device.status !== LicenseStatus.EXPIRED) {
      return res.status(400).json({ message: 'Grace period can only be issued to EXPIRED devices.' });
    }

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);

    const updated = await prisma.device.update({ where: { id }, data: { graceTokenExpiry: expiry } });

    res.json({ message: 'Grace token issued', graceTokenExpiry: updated.graceTokenExpiry });
  } catch (error) {
    console.error('Issue grace token error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
