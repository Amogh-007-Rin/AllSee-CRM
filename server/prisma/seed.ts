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

  // Clean up existing data
  await prisma.renewalRequest.deleteMany({})
  await prisma.device.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.organization.deleteMany({})

  // 1. Create Organizations
  const hq = await prisma.organization.create({
    data: {
      name: 'Global Retail HQ',
      type: OrgType.PARENT,
      billingMode: 'END_USER_CAN_PAY',
    },
  })

  // 1a. Create Reseller Partner Org (The "Big Boss" Reseller)
  const partnerOrg = await prisma.organization.create({
    data: {
      name: 'Global Signs Partners Ltd',
      type: OrgType.RESELLER,
      billingMode: 'END_USER_CAN_PAY', // Resellers pay normally
    },
  })

  // Create Reseller Managed Parent Org (TechGiant)
  const resellerOrg = await prisma.organization.create({
    data: {
      name: 'TechGiant Corp (Reseller Managed)',
      type: OrgType.PARENT,
      billingMode: 'RESELLER_ONLY',
      resellerId: partnerOrg.id, // Link to Partner
    },
  })

  // Create Another Reseller Managed Client (Hotel Group)
  const hotelOrg = await prisma.organization.create({
    data: {
      name: 'Hotel Group Int (Reseller Managed)',
      type: OrgType.PARENT,
      billingMode: 'RESELLER_ONLY',
      resellerId: partnerOrg.id, // Link to Partner
    },
  })

  // Define UK Cities with coordinates
  const ukCities = [
    { name: 'London Flagship', lat: 51.5074, lng: -0.1278, userEmail: 'london' },
    { name: 'Manchester Outlet', lat: 53.4808, lng: -2.2426, userEmail: 'manchester' },
    { name: 'Birmingham Store', lat: 52.4862, lng: -1.8904, userEmail: 'birmingham' },
    { name: 'Leeds Branch', lat: 53.8008, lng: -1.5491, userEmail: 'leeds' },
    { name: 'Glasgow Hub', lat: 55.8642, lng: -4.2518, userEmail: 'glasgow' },
    { name: 'Edinburgh Center', lat: 55.9533, lng: -3.1883, userEmail: 'edinburgh' },
    { name: 'Liverpool Dock', lat: 53.4084, lng: -2.9916, userEmail: 'liverpool' },
    { name: 'Bristol Plaza', lat: 51.4545, lng: -2.5879, userEmail: 'bristol' },
    { name: 'Cardiff Bay', lat: 51.4816, lng: -3.1791, userEmail: 'cardiff' },
    { name: 'Belfast City', lat: 54.5973, lng: -5.9301, userEmail: 'belfast' }
  ]

  // 2. Create Users & Child Orgs
  await prisma.user.create({
    data: {
      email: 'admin@hq.com',
      password: 'password123', // In a real app, this should be hashed
      name: 'HQ Admin',
      role: UserRole.ADMIN,
      organizationId: hq.id,
    },
  })

  // Create Reseller Client User
  await prisma.user.create({
    data: {
      email: 'reseller_client@demo.com',
      password: 'password123',
      name: 'Reseller Client Admin',
      role: UserRole.ADMIN,
      organizationId: resellerOrg.id,
    },
  })

  // Create Reseller Partner User
  await prisma.user.create({
    data: {
      email: 'partner@globalsigns.com',
      password: 'password123',
      name: 'Global Partner Admin',
      role: UserRole.ADMIN,
      organizationId: partnerOrg.id,
    },
  })

  // Create Hotel Group User
  await prisma.user.create({
    data: {
      email: 'admin@hotelgroup.com',
      password: 'password123',
      name: 'Hotel Group Admin',
      role: UserRole.ADMIN,
      organizationId: hotelOrg.id,
    },
  })

  const today = new Date()

  for (const city of ukCities) {
    // Create Child Org
    const childOrg = await prisma.organization.create({
      data: {
        name: city.name,
        type: OrgType.CHILD,
        parentId: hq.id,
      },
    })

    // Create User for Child Org
    await prisma.user.create({
      data: {
        email: `manager@${city.userEmail}.com`,
        password: 'password123',
        name: `${city.name} Manager`,
        role: UserRole.VIEWER,
        organizationId: childOrg.id,
      },
    })

    // Create Mixed Status Devices for each Org
    
    // 1. ACTIVE (Expiry: Today + 120 days)
    for (let i = 1; i <= 2; i++) {
      const expiryDate = new Date(today)
      expiryDate.setDate(today.getDate() + 120)
      await prisma.device.create({
        data: {
          name: `${city.name} Active Screen ${i}`,
          location: city.name,
          serialNumber: `${city.userEmail.toUpperCase()}-ACT-${i}`,
          status: LicenseStatus.ACTIVE,
          expiryDate: expiryDate,
          latitude: city.lat + (Math.random() * 0.02 - 0.01),
          longitude: city.lng + (Math.random() * 0.02 - 0.01),
          organizationId: childOrg.id,
        },
      })
    }

    // 2. EXPIRING_SOON (Expiry: Today + 10-30 days)
    for (let i = 1; i <= 2; i++) {
      const expiryDate = new Date(today)
      expiryDate.setDate(today.getDate() + 10 + Math.floor(Math.random() * 20))
      await prisma.device.create({
        data: {
          name: `${city.name} Warning Screen ${i}`,
          location: city.name,
          serialNumber: `${city.userEmail.toUpperCase()}-WARN-${i}`,
          status: LicenseStatus.EXPIRING_SOON,
          expiryDate: expiryDate,
          latitude: city.lat + (Math.random() * 0.02 - 0.01),
          longitude: city.lng + (Math.random() * 0.02 - 0.01),
          organizationId: childOrg.id,
        },
      })
    }

    // 3. EXPIRED (Expiry: Today - 5 days, Grace Token Active)
    for (let i = 1; i <= 2; i++) {
      const expiryDate = new Date(today)
      expiryDate.setDate(today.getDate() - 5)
      // Set grace token to expire in 2 days from now
      const graceDate = new Date(today)
      graceDate.setDate(today.getDate() + 2)
      
      await prisma.device.create({
        data: {
          name: `${city.name} Expired Screen ${i}`,
          location: city.name,
          serialNumber: `${city.userEmail.toUpperCase()}-EXP-${i}`,
          status: LicenseStatus.EXPIRED,
          expiryDate: expiryDate,
          graceTokenExpiry: graceDate,
          latitude: city.lat + (Math.random() * 0.02 - 0.01),
          longitude: city.lng + (Math.random() * 0.02 - 0.01),
          organizationId: childOrg.id,
        },
      })
    }

    // 4. SUSPENDED (Expiry: Today - 30 days)
    for (let i = 1; i <= 1; i++) {
      const expiryDate = new Date(today)
      expiryDate.setDate(today.getDate() - 30)
      await prisma.device.create({
        data: {
          name: `${city.name} Suspended Screen ${i}`,
          location: city.name,
          serialNumber: `${city.userEmail.toUpperCase()}-SUSP-${i}`,
          status: LicenseStatus.SUSPENDED,
          expiryDate: expiryDate,
          latitude: city.lat + (Math.random() * 0.02 - 0.01),
          longitude: city.lng + (Math.random() * 0.02 - 0.01),
          organizationId: childOrg.id,
        },
      })
    }
  }

  // Create Reseller Devices (Mixed Status)
  const resellerDevices = [
    { status: LicenseStatus.ACTIVE, count: 2, offset: 120 },
    { status: LicenseStatus.EXPIRING_SOON, count: 2, offset: 20 },
    { status: LicenseStatus.EXPIRED, count: 1, offset: -10 },
  ]

  let rDevCount = 1
  for (const group of resellerDevices) {
    for (let i = 0; i < group.count; i++) {
      const expiryDate = new Date(today)
      expiryDate.setDate(today.getDate() + group.offset)
      
      let graceDate = null
      if (group.status === LicenseStatus.EXPIRED) {
        graceDate = new Date(today)
        graceDate.setDate(today.getDate() + 7)
      }

      await prisma.device.create({
        data: {
          name: `Reseller Screen ${rDevCount}`,
          location: 'Main Office',
          serialNumber: `RESELLER-DEV-${rDevCount}`,
          status: group.status,
          expiryDate: expiryDate,
          graceTokenExpiry: graceDate,
          latitude: 51.5074, // London default
          longitude: -0.1278,
          organizationId: resellerOrg.id,
        },
      })
      rDevCount++
    }
  }

  // Create Hotel Group Devices
  let hDevCount = 1
  for (const group of resellerDevices) {
    for (let i = 0; i < group.count; i++) {
      const expiryDate = new Date(today)
      expiryDate.setDate(today.getDate() + group.offset)
      
      let graceDate = null
      if (group.status === LicenseStatus.EXPIRED) {
        graceDate = new Date(today)
        graceDate.setDate(today.getDate() + 7)
      }

      await prisma.device.create({
        data: {
          name: `Hotel Screen ${hDevCount}`,
          location: 'Hotel Lobby',
          serialNumber: `HOTEL-DEV-${hDevCount}`,
          status: group.status,
          expiryDate: expiryDate,
          graceTokenExpiry: graceDate,
          latitude: 48.8566, // Paris default
          longitude: 2.3522,
          organizationId: hotelOrg.id,
        },
      })
      hDevCount++
    }
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
