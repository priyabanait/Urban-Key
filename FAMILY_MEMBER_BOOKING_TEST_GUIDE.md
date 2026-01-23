# Family Member Amenity Booking - API Testing Guide

## Quick Test Scenarios

### Test 1: Add Family Member with Login Credentials

**Request:**
```bash
POST http://localhost:5000/api/family-members
Content-Type: application/json

{
  "residentId": "your_resident_id",
  "name": "Alice Johnson",
  "relation": "Spouse",
  "age": 32,
  "gender": "Female",
  "phone": "9876543210",
  "email": "alice.johnson@example.com",
  "password": "password123",
  "flatId": "your_flat_id"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Family member added successfully with login credentials. Pending admin approval.",
  "data": {
    "_id": "...",
    "name": "Alice Johnson",
    "email": "alice.johnson@example.com",
    "canLogin": true,
    "isApproved": false
  }
}
```

---

### Test 2: Approve Family Member (Admin)

**Request:**
```bash
PUT http://localhost:5000/api/family-members/{familyMemberId}/approve
Authorization: Bearer {admin_token}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Family member approved successfully",
  "data": {
    "_id": "...",
    "isApproved": true,
    "approvedAt": "2026-01-22T..."
  }
}
```

---

### Test 3: Family Member Login

**Request:**
```bash
POST http://localhost:5000/api/auth/family-member/login
Content-Type: application/json

{
  "email": "alice.johnson@example.com",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Alice Johnson",
    "email": "alice.johnson@example.com",
    "type": "family_member",
    "isApproved": true,
    "resident": {...},
    "flat": {...}
  }
}
```

---

### Test 4: Family Member Books Amenity

**Request:**
```bash
POST http://localhost:5000/api/amenity-bookings
Authorization: Bearer {family_member_token}
Content-Type: application/json

{
  "amenityId": "your_amenity_id",
  "bookingDate": "2026-02-01",
  "startTime": "14:00",
  "endTime": "16:00",
  "purpose": "Birthday celebration",
  "numberOfGuests": 20
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Amenity booking created successfully",
  "data": {
    "_id": "...",
    "bookedBy": {
      "userType": "FamilyMember",
      "userId": "...",
      "name": "Alice Johnson"
    },
    "bookingDate": "2026-02-01T00:00:00.000Z",
    "startTime": "14:00",
    "endTime": "16:00",
    "duration": 2,
    "status": "Pending",
    "charges": 500
  }
}
```

---

### Test 5: Get Family Member's Bookings

**Request:**
```bash
GET http://localhost:5000/api/amenity-bookings/my-bookings?societyId={society_id}
Authorization: Bearer {family_member_token}
```

**Expected Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "...",
      "amenity": {
        "name": "Club House",
        "type": "Indoor"
      },
      "bookedBy": {
        "userType": "FamilyMember",
        "name": "Alice Johnson"
      },
      "bookingDate": "2026-02-01",
      "status": "Pending"
    }
  ]
}
```

---

### Test 6: Set Credentials for Existing Family Member

**Request:**
```bash
POST http://localhost:5000/api/auth/family-member/set-credentials
Content-Type: application/json

{
  "familyMemberId": "existing_family_member_id",
  "email": "newuser@example.com",
  "password": "secure123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Credentials set successfully. You can now login.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "...",
    "email": "newuser@example.com",
    "canLogin": true
  }
}
```

---

## Common Error Cases

### 1. Family Member Not Approved
```json
{
  "success": false,
  "message": "Your account is pending approval. Please contact the resident or admin."
}
```

### 2. Email Already Exists
```json
{
  "success": false,
  "message": "Email is already registered with another family member"
}
```

### 3. Invalid Credentials
```json
{
  "success": false,
  "message": "Invalid email or password."
}
```

### 4. No Login Access
```json
{
  "success": false,
  "message": "Login is not enabled for your account. Please contact the resident."
}
```

### 5. Time Slot Conflict
```json
{
  "success": false,
  "message": "This time slot is already booked"
}
```

---

## Postman Collection Variables

Set these environment variables in Postman:

```
base_url = http://localhost:5000
resident_id = {your_resident_id}
family_member_id = {created_family_member_id}
family_member_token = {jwt_token_from_login}
admin_token = {admin_jwt_token}
society_id = {your_society_id}
amenity_id = {your_amenity_id}
flat_id = {your_flat_id}
```

---

## Testing Workflow

1. ✅ **Setup**: Ensure you have a resident and at least one amenity created
2. ✅ **Add Family Member**: Create family member with email/password
3. ✅ **Approve**: Admin approves the family member
4. ✅ **Login**: Family member logs in to get JWT token
5. ✅ **Book Amenity**: Family member creates amenity booking
6. ✅ **View Bookings**: Family member views their bookings
7. ✅ **Admin Review**: Admin can see all bookings including family member bookings

---

## Database Checks

### Check if family member was created:
```javascript
db.familymembers.find({ email: "alice.johnson@example.com" })
```

### Check if booking was created:
```javascript
db.amenitybookings.find({ "bookedBy.userType": "FamilyMember" })
```

### Verify password is hashed:
```javascript
db.familymembers.findOne(
  { email: "alice.johnson@example.com" },
  { password: 1 }
)
// Should return hashed password starting with $2a$ or $2b$
```

---

## Notes

- Family members must be approved (`isApproved: true`) before they can book amenities
- Email and password are optional when creating family members
- If password is provided, email must also be provided
- JWT token contains `type: 'family_member'` to distinguish from resident logins
- Amenity bookings automatically fetch flat and society from the family member's resident relationship
