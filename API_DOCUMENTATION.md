# Unified Signup & Registration API Documentation

## Overview
This document describes the unified API endpoint that handles both user signup and complete resident registration in a single call.

---

## Endpoint: POST `/api/users/signup`

### Description
A single API endpoint that handles:
1. **Basic Signup** - Creates a user account with mobile and OTP
2. **Complete Registration** - Creates both user account and full resident profile in one call

### Request Body

#### Basic Signup (Minimal)
```json
{
  "mobile": "9876543210",
  "otp": "1234",
  "username": "john_doe" // optional
}
```

#### Complete Registration (Full Profile)
```json
{
  "mobile": "9876543210",
  "otp": "1234",
  "username": "john_doe",
  "residentData": {
    "fullName": "John Doe",
    "gender": "Male",
    "dateOfBirth": "1990-05-15",
    "email": "john@example.com",
    "alternateMobile": "9123456789",
    "governmentIdNumber": "ABCD1234E",
    "societyName": "Green Valley Apartments",
    "buildingName": "Tower A",
    "flatNumber": "A-101",
    "floorNumber": 1,
    "flatType": "2 BHK",
    "ownershipType": "Owner",
    "moveInDate": "2024-01-15",
    "numberOfFamilyMembers": 3,
    "familyMembers": [
      {
        "name": "Jane Doe",
        "relation": "Spouse",
        "age": 28
      },
      {
        "name": "Baby Doe",
        "relation": "Child",
        "age": 2
      }
    ],
    "emergencyContactName": "Emergency Contact",
    "emergencyContactNumber": "9999888877",
    "vehicles": [
      {
        "vehicleType": "Four Wheeler",
        "vehicleNumber": "MH01AB1234",
        "parkingSlotNumber": "P-15"
      }
    ],
    "documents": {
      "idProof": "url/to/id-proof.pdf",
      "addressProof": "url/to/address-proof.pdf",
      "photo": "url/to/photo.jpg"
    },
    "remarks": "New resident"
  }
}
```

### Response

#### Success Response (Basic Signup)
```json
{
  "success": true,
  "message": "Signup successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f5a1b2c3d4e5f6g7h8i9j0",
    "username": "john_doe",
    "mobile": "9876543210",
    "registrationCompleted": false,
    "status": "active",
    "role": "user"
  },
  "resident": null
}
```

#### Success Response (Complete Registration)
```json
{
  "success": true,
  "message": "Registration completed successfully. Awaiting admin approval.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f5a1b2c3d4e5f6g7h8i9j0",
    "username": "john_doe",
    "mobile": "9876543210",
    "registrationCompleted": true,
    "status": "pending",
    "role": "resident"
  },
  "resident": {
    "id": "64f5a1b2c3d4e5f6g7h8i9j1",
    "fullName": "John Doe",
    "societyName": "Green Valley Apartments",
    "flatNumber": "A-101",
    "approvedByAdmin": false
  }
}
```

#### Error Responses
```json
// Mobile already registered
{
  "success": false,
  "message": "Mobile number already registered."
}

// Missing required fields
{
  "success": false,
  "message": "Mobile and OTP are required."
}

// Server error
{
  "success": false,
  "message": "Server error during signup/registration.",
  "error": "Error details"
}
```

---

## Other Authentication Endpoints

### Login: POST `/api/users/login-otp`

#### Request
```json
{
  "mobile": "9876543210",
  "otp": "1234"
}
```

#### Response
```json
{
  "success": true,
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f5a1b2c3d4e5f6g7h8i9j0",
    "username": "john_doe",
    "mobile": "9876543210",
    "registrationCompleted": true,
    "status": "active",
    "role": "resident"
  },
  "resident": {
    "id": "64f5a1b2c3d4e5f6g7h8i9j1",
    "fullName": "John Doe",
    "societyName": "Green Valley Apartments",
    "flatNumber": "A-101",
    "approvedByAdmin": true,
    "ownershipType": "Owner"
  }
}
```

### Forgot Password: POST `/api/users/forgot-password`

#### Request
```json
{
  "mobile": "9876543210",
  "newPassword": "5678"
}
```

#### Response
```json
{
  "success": true,
  "message": "Password updated successfully.",
  "user": {
    "id": "64f5a1b2c3d4e5f6g7h8i9j0",
    "username": "john_doe",
    "mobile": "9876543210"
  }
}
```

---

## Backward Compatibility

The old `/api/users/signup-otp` endpoint is still supported for backward compatibility. It will automatically redirect to the new unified `/api/users/signup` endpoint with basic signup (no resident data).

---

## Status Codes

- `201` - Created (successful signup/registration)
- `200` - OK (successful login/password reset)
- `400` - Bad Request (missing required fields, duplicate mobile)
- `401` - Unauthorized (invalid credentials)
- `404` - Not Found (user not found)
- `500` - Internal Server Error

---

## Workflow

### Flow 1: Basic Signup
1. User enters mobile number and receives OTP
2. User submits mobile + OTP to `/api/users/signup`
3. System creates user account
4. User receives JWT token
5. User can complete registration later

### Flow 2: Complete Registration (Recommended)
1. User enters mobile number and receives OTP
2. User fills complete registration form
3. User submits everything to `/api/users/signup` with `residentData`
4. System creates both user account and resident profile
5. User receives JWT token
6. Profile awaits admin approval

### Flow 3: Login
1. User enters mobile number and receives OTP
2. User submits mobile + OTP to `/api/users/login-otp`
3. System returns user data and resident profile (if exists)
4. User receives JWT token

---

## Benefits of Unified API

1. **Reduced API Calls** - Single endpoint for signup and registration
2. **Better UX** - Users complete everything in one go
3. **Atomic Operations** - Both user and resident are created together
4. **Consistency** - Standardized response format
5. **Backward Compatible** - Old endpoints still work
6. **Real-time Notifications** - Admins notified immediately via WebSocket

---

## Notes

- OTP is stored as plain text password (as per your existing logic)
- JWT token expires in 30 days
- Resident profiles require admin approval
- All responses include `success` boolean flag
- WebSocket notifications sent to admin dashboard on new registrations
