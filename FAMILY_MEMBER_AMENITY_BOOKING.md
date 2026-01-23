# Family Member Amenity Booking - Updated Backend

## Overview
The backend has been updated to allow family members to authenticate and book amenities independently. This document explains how family member registration and amenity booking works.

## Family Member Registration Flow

### 1. Basic Registration (By Resident)
A resident can add family members with or without login credentials.

**Endpoint:** `POST /api/family-members`

**Request Body:**
```json
{
  "residentId": "resident_object_id",
  "name": "John Doe",
  "relation": "Spouse",
  "age": 35,
  "gender": "Male",
  "phone": "9876543210",
  "email": "john.doe@example.com",  // Optional
  "password": "securepassword123",  // Optional
  "flatId": "flat_object_id"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Family member added successfully with login credentials. Pending admin approval.",
  "data": {
    "_id": "family_member_id",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "isApproved": false,
    "canLogin": true
  }
}
```

**Notes:**
- If both `email` and `password` are provided, the family member can log in
- Email must be unique across all family members
- Password must be at least 6 characters
- Family member must be approved by admin before they can book amenities

### 2. Set Credentials Later
Family members added without credentials can set them later.

**Endpoint:** `POST /api/auth/family-member/set-credentials`

**Request Body:**
```json
{
  "familyMemberId": "family_member_object_id",
  "email": "john.doe@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Credentials set successfully. You can now login.",
  "token": "jwt_token_here",
  "user": {
    "id": "family_member_id",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "type": "family_member",
    "isApproved": true,
    "canLogin": true
  }
}
```

## Family Member Authentication

### Login
**Endpoint:** `POST /api/auth/family-member/login`

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful.",
  "token": "jwt_token_here",
  "user": {
    "id": "family_member_id",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "relation": "Spouse",
    "phone": "9876543210",
    "type": "family_member",
    "isApproved": true,
    "resident": {
      "_id": "resident_id",
      "fullName": "Jane Doe",
      "mobile": "9123456789"
    },
    "flat": {
      "_id": "flat_id",
      "flatNo": "101",
      "tower": "A"
    }
  }
}
```

**JWT Token Payload:**
```json
{
  "id": "family_member_id",
  "email": "john.doe@example.com",
  "name": "John Doe",
  "type": "family_member",
  "residentId": "resident_id",
  "flatId": "flat_id"
}
```

## Amenity Booking by Family Members

### Create Booking (Authenticated)
Family members can now create bookings using their authentication token.

**Endpoint:** `POST /api/amenity-bookings`
**Headers:** `Authorization: Bearer <family_member_token>`

**Request Body:**
```json
{
  "amenityId": "amenity_object_id",
  "bookingDate": "2026-01-25",
  "startTime": "14:00",
  "endTime": "16:00",
  "purpose": "Birthday Party",
  "numberOfGuests": 25
}
```

**Response:**
```json
{
  "success": true,
  "message": "Amenity booking created successfully",
  "data": {
    "_id": "booking_id",
    "amenity": {
      "_id": "amenity_id",
      "name": "Club House",
      "type": "Indoor",
      "location": "Ground Floor"
    },
    "flat": {
      "_id": "flat_id",
      "flatNo": "101",
      "tower": "A"
    },
    "bookedBy": {
      "userType": "FamilyMember",
      "userId": "family_member_id",
      "name": "John Doe"
    },
    "bookingDate": "2026-01-25T00:00:00.000Z",
    "startTime": "14:00",
    "endTime": "16:00",
    "duration": 2,
    "purpose": "Birthday Party",
    "numberOfGuests": 25,
    "charges": 500,
    "status": "Pending"
  }
}
```

**How It Works:**
1. System extracts user info from JWT token
2. Identifies user as `family_member` type
3. Verifies family member is approved
4. Fetches flat details through resident relationship
5. Creates booking with `bookedBy.userType = 'FamilyMember'`

### Get My Bookings (Authenticated)
**Endpoint:** `GET /api/amenity-bookings/my-bookings?societyId=<society_id>`
**Headers:** `Authorization: Bearer <family_member_token>`

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "booking_id_1",
      "amenity": {
        "name": "Club House",
        "type": "Indoor"
      },
      "bookedBy": {
        "userType": "FamilyMember",
        "userId": "family_member_id",
        "name": "John Doe"
      },
      "bookingDate": "2026-01-25T00:00:00.000Z",
      "status": "Approved"
    }
  ]
}
```

## Database Schema Updates

### FamilyMember Model
```javascript
{
  resident: ObjectId (ref: Resident) - required,
  flat: ObjectId (ref: Flat) - optional,
  name: String - required,
  relation: String - enum: ['Spouse', 'Child', 'Parent', 'Sibling', 'Other'],
  age: Number,
  gender: String - enum: ['Male', 'Female', 'Other'],
  email: String - unique, sparse, lowercase,
  phone: String,
  password: String - hashed, not selected by default,
  photo: String,
  isApproved: Boolean - default: false,
  canLogin: Boolean - default: false,
  approvedBy: ObjectId (ref: User),
  approvedAt: Date,
  lastLogin: Date,
  timestamps: true
}
```

### AmenityBooking Model
```javascript
{
  bookedBy: {
    userType: String - enum: ['Resident', 'FamilyMember'],
    userId: ObjectId - refPath based on userType,
    name: String
  }
  // ... other fields remain the same
}
```

## API Endpoints Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/family-members` | POST | No | Add family member (with optional credentials) |
| `/api/auth/family-member/login` | POST | No | Family member login |
| `/api/auth/family-member/set-credentials` | POST | No | Set email/password for existing family member |
| `/api/amenity-bookings` | POST | Yes | Create amenity booking (works for both residents and family members) |
| `/api/amenity-bookings/my-bookings` | GET | Yes | Get bookings for authenticated user |

## Admin Approval Workflow

1. Resident adds family member (with or without credentials)
2. Family member status: `isApproved: false`
3. Admin reviews and approves: `PUT /api/family-members/:id/approve`
4. Family member can now:
   - Login (if credentials were set)
   - Book amenities
   - View their bookings

## Security Features

- Passwords are hashed using bcrypt before storage
- JWT tokens expire after 30 days
- Family members must be approved before booking amenities
- Email must be unique across all family members
- Authentication required for creating and viewing bookings

## Example Usage Flow

### Scenario: Resident adds spouse with login access

1. **Resident adds family member:**
```bash
POST /api/family-members
{
  "residentId": "res123",
  "name": "Sarah Smith",
  "relation": "Spouse",
  "email": "sarah.smith@email.com",
  "password": "password123"
}
```

2. **Admin approves the family member:**
```bash
PUT /api/family-members/fm456/approve
```

3. **Family member logs in:**
```bash
POST /api/auth/family-member/login
{
  "email": "sarah.smith@email.com",
  "password": "password123"
}
# Returns JWT token
```

4. **Family member books amenity:**
```bash
POST /api/amenity-bookings
Headers: Authorization: Bearer <jwt_token>
{
  "amenityId": "am789",
  "bookingDate": "2026-02-01",
  "startTime": "10:00",
  "endTime": "12:00",
  "purpose": "Family gathering"
}
```

5. **Family member views bookings:**
```bash
GET /api/amenity-bookings/my-bookings?societyId=soc111
Headers: Authorization: Bearer <jwt_token>
```

## Migration Notes

- Existing family members without email/password can continue to exist
- They can set credentials later using the set-credentials endpoint
- Existing amenity bookings remain unchanged
- The `bookedBy` field structure supports both Resident and FamilyMember types
