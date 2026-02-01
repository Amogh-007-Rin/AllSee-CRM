# AllSee CRM

AllSee CRM is a robust Customer Relationship Management and Device Management system designed specifically for the Digital Signage industry. It facilitates complex hierarchical relationships between Resellers, Parent Organizations, and Child Sites, enabling efficient management of device assets, software licenses, and renewal workflows.

## 🚀 Features

### 🏢 Organization & Role Management
- **Hierarchical Structure:** Supports multi-level organizations (Reseller -> Parent -> Child).
- **Role-Based Access Control (RBAC):** Tailored views and permissions for Admins, Resellers, Parents, and Child users.
- **Reseller Portal:** Dedicated tools for resellers to manage multiple clients, view incoming requests, and generate quotes.

### 🖥️ Device & Asset Management
- **Asset Tracking:** Monitor device status, location, and serial numbers.
- **Interactive Maps:** Visual representation of device distribution using Leaflet maps.
- **License Management:** Track license expiry, status (Active, Expired), and renewal history.
- **Bulk Operations:**
  - **Bulk Renew:** Renew multiple devices simultaneously.
  - **Co-Terming:** Align multiple license expiry dates to a single common date for simplified billing.
- **Grace Tokens:** Issue emergency grace period tokens for expired devices.

### 🔄 Renewal Workflow System
- **Request Cycle:** Child sites or Clients can initiate renewal requests.
- **Quote Generation:** Resellers can generate and send professional PDF quotes for renewal requests.
- **Approval Process:** Parents/Admins can review, approve (with payment integration), or reject requests.
- **Invoicing:** Automatic invoice generation and download upon successful payment.

### 📊 Dashboard & Analytics
- **Real-time Stats:** Overview of active/expired licenses, total revenue, and pending requests.
- **Client Management:** Resellers can view a list of all managed clients and their health status.

---

## 🛠️ Tech Stack

### Client (Frontend)
- **Framework:** [React](https://react.dev/) (via [Vite](https://vitejs.dev/))
- **Language:** TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **HTTP Client:** [Axios](https://axios-http.com/)
- **Maps:** [React Leaflet](https://react-leaflet.js.org/)
- **PDF Generation:** [jsPDF](https://github.com/parallax/jsPDF)

### Server (Backend)
- **Runtime:** [Node.js](https://nodejs.org/)
- **Framework:** [Express](https://expressjs.com/)
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Language:** TypeScript
- **Authentication:** JWT (JSON Web Tokens) & bcryptjs
- **Scheduling:** node-cron (for background tasks)

---

## 📂 Project Structure

```
AllSee-CRM/
├── client/                 # Frontend React Application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React Context (Auth, etc.)
│   │   ├── pages/          # Application Pages/Routes
│   │   ├── services/       # API service configuration
│   │   └── ...
├── server/                 # Backend Express Application
│   ├── prisma/
│   │   ├── schema.prisma   # Database Schema
│   │   ├── seed.ts         # Database Seeding Script
│   │   └── migrations/     # SQL Migrations
│   ├── src/
│   │   ├── controllers/    # Request Handlers
│   │   ├── middleware/     # Auth & Error Middleware
│   │   ├── routes/         # API Route Definitions
│   │   └── ...
└── Readme.md               # Project Documentation
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/devices` - Get list of devices
- `GET /api/dashboard/clients` - Get list of reseller clients

### Device Management
- `POST /api/devices/bulk-renew` - Renew multiple devices
- `POST /api/devices/co-term` - Co-term licenses
- `POST /api/devices/:id/grace-token` - Issue grace token
- `DELETE /api/devices/:id` - Delete a device

### Renewal Requests
- `POST /api/requests` - Create a new renewal request
- `GET /api/requests` - Get requests (Parent/Child view)
- `GET /api/requests/reseller` - Get requests (Reseller view)
- `POST /api/requests/:id/respond` - Reseller responds with quote
- `GET /api/requests/:id/quote` - Download Quote PDF
- `POST /api/requests/:id/approve` - Approve request & Process Payment
- `POST /api/requests/:id/reject` - Reject request

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL installed and running

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd AllSee-CRM
    ```

2.  **Backend Setup**
    ```bash
    cd server
    
    # Install dependencies
    npm install
    
    # Configure Environment Variables
    # Create a .env file with:
    # DATABASE_URL="postgresql://user:password@localhost:5432/allsee_db"
    # JWT_SECRET="your_super_secret_key"
    # PORT=3000
    
    # Run Database Migrations
    npx prisma migrate dev
    
    # Seed Database (Optional but recommended for demo data)
    npx prisma db seed
    
    # Start Development Server
    npm run dev
    ```

3.  **Frontend Setup**
    ```bash
    cd ../client
    
    # Install dependencies
    npm install
    
    # Start Development Server
    npm run dev
    ```

4.  **Access the Application**
    - Frontend: `http://localhost:5173`
    - Backend: `http://localhost:3000`

### Default Login Credentials (from Seed)
- **HQ Admin:** `admin@hq.com` / `password123`
- **Reseller Partner:** `partner@globalsigns.com` / `password123`
- **Reseller Client:** `reseller_client@demo.com` / `password123`


### Credentials for children organisations (Branch manager)
- manager@birmingham.com / `password123`
- manager@london.com / `password123`
- manager@manchester.com / `password123`
- manager@liverpool.com / `password123`
- manager@newyork.com / `password123`
- manager@paris.com / `password123`
- manager@tokyo.com / `password123`
- manager@singapore.com / `password123`
- manager@toronto.com / `password123`
- manager@mumbai.com / `password123`
