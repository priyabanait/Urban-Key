# Society Gate Backend API

Backend API server for Society Gate Management System built with Node.js, Express, and MongoDB.

## Features

- **Authentication & Authorization** - JWT-based authentication with role-based access control
- **Tower Management** - Create and manage society towers
- **Flat Management** - Manage flats with occupancy tracking
- **Resident Management** - Handle resident registration and approvals
- **Amenities** - Manage society amenities and bookings
- **Announcements** - Create and distribute announcements
- **Polls** - Conduct polls and voting
- **Helpdesk** - Ticket management system
- **Visitors** - Visitor entry and tracking
- **Maintenance** - Billing and payment tracking
- **Approvals** - Workflow for family members, vehicles, and staff

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** express-validator
- **Security:** bcryptjs for password hashing

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   - Copy `.env.example` to `.env`
   ```bash
   copy .env.example .env
   ```

4. **Configure environment variables in `.env`:**
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/societygate
   JWT_SECRET=your_secure_jwt_secret_key
   JWT_EXPIRE=7d
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173
   ```

5. **Start MongoDB:**
   - If using local MongoDB, ensure it's running
   - If using MongoDB Atlas, update MONGODB_URI with your connection string

6. **Run the server:**
   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Towers
- `GET /api/towers` - Get all towers
- `GET /api/towers/:id` - Get single tower
- `POST /api/towers` - Create tower (requires SOCIETY_MANAGE permission)
- `PUT /api/towers/:id` - Update tower (requires SOCIETY_MANAGE permission)
- `DELETE /api/towers/:id` - Delete tower (requires SOCIETY_MANAGE permission)

### Flats
- `GET /api/flats` - Get all flats with filters
- `GET /api/flats/:id` - Get single flat
- `GET /api/flats/stats/summary` - Get flat statistics
- `POST /api/flats` - Create flat (requires SOCIETY_MANAGE permission)
- `PUT /api/flats/:id` - Update flat (requires SOCIETY_MANAGE permission)
- `DELETE /api/flats/:id` - Delete flat (requires SOCIETY_MANAGE permission)

### Residents
- `GET /api/residents` - Get all residents
- `GET /api/residents/:id` - Get single resident
- `POST /api/residents` - Create resident
- `PUT /api/residents/:id` - Update resident
- `PUT /api/residents/:id/approve` - Approve resident (requires SOCIETY_APPROVALS permission)
- `DELETE /api/residents/:id` - Delete resident (requires SOCIETY_MANAGE permission)

### Amenities
- `GET /api/amenities` - Get all amenities
- `GET /api/amenities/:id` - Get single amenity
- `POST /api/amenities` - Create amenity (requires AMENITIES_MANAGE permission)
- `PUT /api/amenities/:id` - Update amenity (requires AMENITIES_MANAGE permission)
- `DELETE /api/amenities/:id` - Delete amenity (requires AMENITIES_MANAGE permission)

### Announcements
- `GET /api/announcements` - Get all announcements
- `GET /api/announcements/:id` - Get single announcement
- `POST /api/announcements` - Create announcement (requires ANNOUNCEMENTS_MANAGE permission)
- `PUT /api/announcements/:id` - Update announcement (requires ANNOUNCEMENTS_MANAGE permission)
- `DELETE /api/announcements/:id` - Delete announcement (requires ANNOUNCEMENTS_MANAGE permission)

### Polls
- `GET /api/polls` - Get all polls
- `GET /api/polls/:id` - Get single poll
- `POST /api/polls` - Create poll (requires POLLS_MANAGE permission)
- `POST /api/polls/:id/vote` - Submit vote
- `PUT /api/polls/:id/close` - Close poll (requires POLLS_MANAGE permission)

### Helpdesk
- `GET /api/helpdesk` - Get all tickets
- `GET /api/helpdesk/:id` - Get single ticket
- `POST /api/helpdesk` - Create ticket
- `PUT /api/helpdesk/:id/status` - Update ticket status (requires HELPDESK_MANAGE permission)
- `PUT /api/helpdesk/:id/assign` - Assign ticket (requires HELPDESK_MANAGE permission)
- `POST /api/helpdesk/:id/comment` - Add comment

### Visitors
- `GET /api/visitors` - Get all visitors
- `GET /api/visitors/:id` - Get single visitor
- `POST /api/visitors` - Create visitor entry
- `PUT /api/visitors/:id/status` - Update visitor status
- `PUT /api/visitors/:id/checkout` - Checkout visitor

### Maintenance
- `GET /api/maintenance` - Get all maintenance records
- `GET /api/maintenance/:id` - Get single maintenance record
- `GET /api/maintenance/stats/summary` - Get payment summary (requires MAINTENANCE_REPORTS permission)
- `POST /api/maintenance` - Create maintenance bill (requires MAINTENANCE_MANAGE permission)
- `PUT /api/maintenance/:id/payment` - Record payment (requires MAINTENANCE_MANAGE permission)

### Approvals
- `GET /api/approvals/pending` - Get all pending approvals (requires SOCIETY_APPROVALS permission)
- `PUT /api/approvals/family/:id/approve` - Approve family member (requires SOCIETY_APPROVALS permission)
- `PUT /api/approvals/vehicle/:id/approve` - Approve vehicle (requires SOCIETY_APPROVALS permission)
- `PUT /api/approvals/maid/:id/approve` - Approve maid (requires SOCIETY_APPROVALS permission)
- `DELETE /api/approvals/:type/:id` - Reject approval (requires SOCIETY_APPROVALS permission)

## Database Models

### Core Models
- **Tower** - Society towers/buildings
- **Flat** - Individual flats/apartments
- **Resident** - Resident information
- **FamilyMember** - Resident family members
- **Vehicle** - Resident vehicles
- **Maid** - Domestic help/staff

### Service Models
- **Amenity** - Society amenities
- **Announcement** - Announcements and notices
- **Poll** - Polls and surveys
- **Helpdesk** - Support tickets
- **Visitor** - Visitor logs
- **Maintenance** - Billing and payments

## Middleware

### Authentication Middleware
- **authenticate** - Verifies JWT token
- **authorize(...roles)** - Role-based access control
- **checkPermission(permission)** - Permission-based access control

### Validation Middleware
- Request validation using express-validator
- Custom validation rules for each resource

### Error Handling
- Centralized error handling middleware
- Consistent error response format

## Development

### Project Structure
```
backend/
├── config/         # Configuration files
├── middleware/     # Express middleware
├── models/         # Mongoose models
├── routes/         # API routes
├── server.js       # Entry point
├── package.json
└── .env
```

### Adding New Features

1. Create model in `models/`
2. Create routes in `routes/`
3. Add middleware if needed
4. Register routes in `server.js`

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based and permission-based authorization
- Input validation
- CORS configuration

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Optional message"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (development only)"
}
```

## License

ISC
