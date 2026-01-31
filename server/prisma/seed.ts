import { PrismaClient, OrgType, UserRole, LicenseStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Start seeding ...')

  // 1. Create Organizations
  const hq = await prisma.organization.create({
    data: {
      name: 'Global Retail HQ',
      type: OrgType.PARENT,
      billingMode: 'END_USER_CAN_PAY',
    },
  })

  const london = await prisma.organization.create({
    data: {
      name: 'London Flagship',
      type: OrgType.CHILD,
      parentId: hq.id,
    },
  })

  const manchester = await prisma.organization.create({
    data: {
      name: 'Manchester Outlet',
      type: OrgType.CHILD,
      parentId: hq.id,
    },
  })

  // 2. Create Users
  await prisma.user.create({
    data: {
      email: 'admin@hq.com',
      password: 'password123', // In a real app, this should be hashed
      name: 'HQ Admin',
      role: UserRole.ADMIN,
      organizationId: hq.id,
    },
  })

  await prisma.user.create({
    data: {
      email: 'manager@london.com',
      password: 'password123',
      name: 'London Manager',
      role: UserRole.VIEWER,
      organizationId: london.id,
    },
  })

  // 3. Create Devices
  const today = new Date()

  // London Devices
  // 3 Active (Expiry: Today + 120 days)
  for (let i = 1; i <= 3; i++) {
    const expiryDate = new Date(today)
    expiryDate.setDate(today.getDate() + 120)
    await prisma.device.create({
      data: {
        name: `London Active Screen ${i}`,
        location: 'London Store',
        serialNumber: `LDN-ACT-${i}`,
        status: LicenseStatus.ACTIVE,
        expiryDate: expiryDate,
        organizationId: london.id,
      },
    })
  }

  // 3 Expiring Soon (Expiry: Today + 30 days)
  for (let i = 1; i <= 3; i++) {
    const expiryDate = new Date(today)
    expiryDate.setDate(today.getDate() + 30)
    await prisma.device.create({
      data: {
        name: `London Warning Screen ${i}`,
        location: 'London Store',
        serialNumber: `LDN-WARN-${i}`,
        status: LicenseStatus.EXPIRING_SOON,
        expiryDate: expiryDate,
        organizationId: london.id,
      },
    })
  }

  // 4 Expired (Expiry: Today - 5 days)
  for (let i = 1; i <= 4; i++) {
    const expiryDate = new Date(today)
    expiryDate.setDate(today.getDate() - 5)
    await prisma.device.create({
      data: {
        name: `London Expired Screen ${i}`,
        location: 'London Store',
        serialNumber: `LDN-EXP-${i}`,
        status: LicenseStatus.EXPIRED,
        expiryDate: expiryDate,
        organizationId: london.id,
      },
    })
  }

  // Manchester Devices
  // 5 Suspended (Expiry: Today - 20 days)
  for (let i = 1; i <= 5; i++) {
    const expiryDate = new Date(today)
    expiryDate.setDate(today.getDate() - 20)
    await prisma.device.create({
      data: {
        name: `Manchester Suspended Screen ${i}`,
        location: 'Manchester Outlet',
        serialNumber: `MAN-SUSP-${i}`,
        status: LicenseStatus.SUSPENDED,
        expiryDate: expiryDate,
        organizationId: manchester.id,
      },
    })
  }

  console.log('Seeding completed successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
