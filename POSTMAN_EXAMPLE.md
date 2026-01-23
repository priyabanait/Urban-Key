# Postman API Example - User Registration

## Two-Step Registration Process

### Step 1: Signup with OTP
**URL:** `http://localhost:5000/api/users/signup`  
**Method:** `POST`  

### Step 2: Complete Registration  
**URL:** `http://localhost:5000/api/users/complete-registration`  
**Method:** `POST`  

**Content-Type:** `application/json` (for both)

---

## STEP 1: Basic Signup with OTP

### Endpoint
```
POST http://localhost:5000/api/users/signup
```

### Request Body (Minimal Signup)
```json
{
  "mobile": "9876543210",
  "otp": "1234",
  "username": "john_doe"
}
```

### Expected Response
```json
{
  "success": true,
  "message": "Signup successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "658a3b2c3d4e5f6g7h8i9j0",
    "username": "john_doe",
    "mobile": "9876543210",
    "registrationCompleted": false,
    "status": "active",
    "role": "user"
  },
  "resident": null
}
```

---

## STEP 2: Complete Registration with Same Mobile

### Endpoint
```
POST http://localhost:5000/api/users/complete-registration
```

### Request Body (Full Profile)
### Request Body (Full Profile)

```json
{
  "mobile": "9876543210",
  "residentData": {
    "fullName": "John Doe",
    "gender": "Male",
    "dateOfBirth": "1990-05-15",
    "email": "john.doe@example.com",
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
      "idProof": "https://example.com/uploads/id-proof.pdf",
      "addressProof": "https://example.com/uploads/address-proof.pdf",
      "rentAgreement": "",
      "photo": "https://example.com/uploads/photo.jpg"
    },
    "remarks": "New resident registration"
  }
}
```

**Note:** Use the SAME mobile number (9876543210) that you used in Step 1!

### Expected Response
```json
{
  "success": true,
  "message": "Registration completed successfully. Awaiting admin approval.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1OGEzYjJjM2Q0ZTVmNmc3aDhpOWowIiwidXNlcm5hbWUiOiJqb2huX2RvZSIsIm1vYmlsZSI6Ijk4NzY1NDMyMTAiLCJ0eXBlIjoicmVzaWRlbnQiLCJpYXQiOjE3MDYwMDAwMDAsImV4cCI6MTcwODU5MjAwMH0.xyz123abc456",
  "user": {
    "id": "658a3b2c3d4e5f6g7h8i9j0",
    "username": "john_doe",
    "mobile": "9876543210",
    "registrationCompleted": true,
    "status": "pending",
    "role": "resident"
  },
  "resident": {
    "id": "658a3b2c3d4e5f6g7h8i9j1",
    "fullName": "John Doe",
    "societyName": "Green Valley Apartments",
    "flatNumber": "A-101",
    "approvedByAdmin": false
  }
}
```

---

## Complete Two-Step Flow Example

### 1️⃣ First Request: Signup
```bash
curl -X POST http://localhost:5000/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "mobile": "9876543210",
    "otp": "1234",
    "username": "john_doe"
  }'
```

### 2️⃣ Second Request: Complete Registration
```bash
curl -X POST http://localhost:5000/api/users/complete-registration \
  -H "Content-Type: application/json" \
  -d '{
    "mobile": "9876543210",
    "residentData": {
      "fullName": "John Doe",
      "gender": "Male",
      "email": "john@example.com",
      "societyName": "Green Valley Apartments",
      "flatNumber": "A-101",
      "ownershipType": "Owner",
      "numberOfFamilyMembers": 1
    }
  }'
```

---

## Expected Response (Success)

```json
{
  "success": true,
  "message": "Registration completed successfully. Awaiting admin approval.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1OGEzYjJjM2Q0ZTVmNmc3aDhpOWowIiwidXNlcm5hbWUiOiJqb2huX2RvZSIsIm1vYmlsZSI6Ijk4NzY1NDMyMTAiLCJ0eXBlIjoicmVzaWRlbnQiLCJpYXQiOjE3MDYwMDAwMDAsImV4cCI6MTcwODU5MjAwMH0.xyz123abc456",
  "user": {
    "id": "658a3b2c3d4e5f6g7h8i9j0",
    "username": "john_doe",
    "mobile": "9876543210",
    "registrationCompleted": true,
    "status": "pending",
    "role": "resident"
  },
  "resident": {
    "id": "658a3b2c3d4e5f6g7h8i9j1",
    "fullName": "John Doe",
    "societyName": "Green Valley Apartments",
    "flatNumber": "A-101",
    "approvedByAdmin": false
  }
}
```

---

## Alternative: One-Step Registration (Optional)

If you want to do everything in one call, you can still use the unified endpoint:

### Endpoint
```
POST http://localhost:5000/api/users/signup
```

### Request Body
```json
{
  "mobile": "9999888877",
  "otp": "1234",
  "username": "test_user",
  "residentData": {
    "fullName": "Test User",
    "gender": "Male",
    "email": "test@example.com",
    "societyName": "Green Valley Apartments",
    "flatNumber": "D-401",
    "ownershipType": "Owner",
    "numberOfFamilyMembers": 1
  }
}
```

This will create both user and resident profile in one call.

---

## Postman Setup Instructions

### For Step 1: Signup
1. Open Postman
2. Click **New** → **HTTP Request**
3. Name it: "Step 1 - User Signup"
4. **Method:** `POST`
5. **URL:** `http://localhost:5000/api/users/signup`
6. **Headers:** `Content-Type: application/json`
7. **Body:** Select **raw** → **JSON**
8. Paste:
```json
{
  "mobile": "9876543210",
  "otp": "1234",
  "username": "john_doe"
}
```
9. Click **Send**
10. Save the response (user is created with registrationCompleted: false)

### For Step 2: Complete Registration
1. Create another request
2. Name it: "Step 2 - Complete Registration"
3. **Method:** `POST`
4. **URL:** `http://localhost:5000/api/users/complete-registration`
5. **Headers:** `Content-Type: application/json`
6. **Body:** Select **raw** → **JSON**
7. Paste:
```json
{
  "mobile": "9876543210",
  "residentData": {
    "fullName": "John Doe",
    "gender": "Male",
    "email": "john@example.com",
    "societyName": "Green Valley Apartments",
    "flatNumber": "A-101",
    "ownershipType": "Owner",
    "numberOfFamilyMembers": 1
  }
}
```
8. Click **Send**
9. User profile is now complete!

---

## Test Different Users (Two-Step Process)

### User 1 - Owner with Family
**Step 1 - Signup:**
```json
{
  "mobile": "9876543211",
  "otp": "1234",
  "username": "rajesh_kumar"
}
```

**Step 2 - Registration:**
```json
{
  "mobile": "9876543211",
  "residentData": {
    "fullName": "Rajesh Kumar",
    "gender": "Male",
    "email": "rajesh@example.com",
    "societyName": "Green Valley Apartments",
    "flatNumber": "A-101",
    "ownershipType": "Owner",
    "numberOfFamilyMembers": 2,
    "familyMembers": [
      {
        "name": "Priya Kumar",
        "relation": "Spouse",
        "age": 32
      }
    ]
  }
}
```

### User 2 - Tenant
**Step 1 - Signup:**
```json
{
  "mobile": "9876543212",
  "otp": "1234",
  "username": "amit_sharma"
}
```

**Step 2 - Registration:**
```json
{
  "mobile": "9876543212",
  "residentData": {
    "fullName": "Amit Sharma",
    "gender": "Male",
    "email": "amit@example.com",
    "societyName": "Green Valley Apartments",
    "flatNumber": "B-205",
    "ownershipType": "Tenant",
    "numberOfFamilyMembers": 1
  }
}
```

### User 3 - With Vehicle
**Step 1 - Signup:**
```json
{
  "mobile": "9876543213",
  "otp": "1234",
  "username": "neha_patel"
}
```

**Step 2 - Registration:**
```json
{
  "mobile": "9876543213",
  "residentData": {
    "fullName": "Neha Patel",
    "gender": "Female",
    "email": "neha@example.com",
    "societyName": "Green Valley Apartments",
    "flatNumber": "C-302",
    "ownershipType": "Owner",
    "numberOfFamilyMembers": 1,
    "vehicles": [
      {
        "vehicleType": "Two Wheeler",
        "vehicleNumber": "MH12XY5678",
        "parkingSlotNumber": "TW-25"
      }
    ]
  }
}
```

---

## Common Errors & Solutions

### Error: "User not found. Please sign up first."
**Solution:** Complete Step 1 (signup) before Step 2 (registration)

### Error: "Registration already completed"
**Solution:** This mobile number already completed registration. Use a different mobile or login instead

### Error: "Mobile number already registered"
**Solution:** This mobile already has a user account. Skip Step 1 and go to Step 2, or use different mobile
```bash
# In MongoDB
db.users.deleteOne({ mobile: "9876543210" })
db.societymembers.deleteOne({ mobile: "9876543210" })
```

### Error: "Resident profile already exists"
**Solution:** This user already has a complete profile. Login instead

### Error: "Mobile and OTP are required" (Step 1)
**Solution:** Ensure both `mobile` and `otp` fields are present in signup request

### Error: "Resident data is required" (Step 2)
**Solution:** Ensure `residentData` object is present in registration request

### Error: 500 Internal Server Error
**Solution:** Check if:
- MongoDB is running
- Backend server is running
- All required models are properly imported

---

## Copy-Paste Ready Bodies

### Step 1: Signup
```json
{
  "mobile": "9876543210",
  "otp": "1234",
  "username": "john_doe"
}
```

### Step 2: Complete Registration (Minimal)
```json
{
  "mobile": "9876543210",
  "residentData": {
    "fullName": "John Doe",
    "gender": "Male",
    "email": "john@example.com",
    "societyName": "Green Valley Apartments",
    "flatNumber": "A-101",
    "ownershipType": "Owner",
    "numberOfFamilyMembers": 1
  }
}
```

**Remember: Use the SAME mobile number in both steps!**

---

## Quick Test Checklist

- [ ] Step 1: POST to `/api/users/signup` with mobile + OTP
- [ ] Verify response has `registrationCompleted: false`
- [ ] Step 2: POST to `/api/users/complete-registration` with same mobile + residentData
- [ ] Verify response has `registrationCompleted: true`
- [ ] Verify resident profile is created
- [ ] Login to check if resident data is returned
