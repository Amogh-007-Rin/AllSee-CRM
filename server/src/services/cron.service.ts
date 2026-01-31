
import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';
import { LicenseStatus } from '@prisma/client';

export const startCronJobs = () => {
  console.log('Starting Logic Engine Cron Jobs...');

  // Run every night at 00:00
  cron.schedule('0 0 * * *', async () => {
    console.log('Running Daily License Status Check...');
    await checkLicenseStatuses();
  });
};

export const checkLicenseStatuses = async () => {
  const today = new Date();
  const sixtyDaysFromNow = new Date();
  sixtyDaysFromNow.setDate(today.getDate() + 60);

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(today.getDate() - 14);

  try {
    // 1. Warning: Find devices expiring in 60 days (or less, but not yet expired) -> Update status to EXPIRING_SOON
    const warningUpdate = await prisma.device.updateMany({
      where: {
        status: LicenseStatus.ACTIVE,
        expiryDate: {
          lte: sixtyDaysFromNow,
          gt: today
        }
      },
      data: {
        status: LicenseStatus.EXPIRING_SOON
      }
    });
    console.log(`[Job 1] Set to EXPIRING_SOON: ${warningUpdate.count} devices`);

    // 2. Grace Period: Find devices where expiryDate < Today -> Update status to EXPIRED. Do not suspend yet.
    const expiredUpdate = await prisma.device.updateMany({
      where: {
        status: {
          in: [LicenseStatus.ACTIVE, LicenseStatus.EXPIRING_SOON]
        },
        expiryDate: {
          lte: today
        }
      },
      data: {
        status: LicenseStatus.EXPIRED
      }
    });
    console.log(`[Job 2] Set to EXPIRED (Grace Period): ${expiredUpdate.count} devices`);

    // 2.b Auto-issue a 7-day grace token to recently expired devices that do not yet have one
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const graceIssued = await prisma.device.updateMany({
      where: {
        status: LicenseStatus.EXPIRED, // Only target EXPIRED devices (not SUSPENDED)
        expiryDate: {
          lte: today
        },
        graceTokenExpiry: null
      },
      data: {
        graceTokenExpiry: sevenDaysFromNow
      }
    });
    console.log(`[Job 2b] Grace tokens issued to: ${graceIssued.count} devices`);

    // 3. Suspension: Find devices where expiryDate < Today - 14 Days -> Update status to SUSPENDED.
    const suspendedUpdate = await prisma.device.updateMany({
      where: {
        status: {
          in: [LicenseStatus.ACTIVE, LicenseStatus.EXPIRING_SOON, LicenseStatus.EXPIRED]
        },
        expiryDate: {
          lte: fourteenDaysAgo
        }
      },
      data: {
        status: LicenseStatus.SUSPENDED
      }
    });
    console.log(`[Job 3] Set to SUSPENDED: ${suspendedUpdate.count} devices`);

  } catch (error) {
    console.error('Error running license status check:', error);
  }
};
