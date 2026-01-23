# Resident and Family Member Amenity Booking Guide

## ✅ Current Implementation Status

Both **Residents** (head of family) and **Family Members** can independently book amenities using the same endpoint with authentication.

---

## 🏠 Resident Amenity Booking

### Step 1: Resident Login
```http
POST /api/auth/login-otp
Content-Type: application/json

{
  "mobile": "9123456789",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "resident_id",
    "mobile": "9123456789",
    "role": "resident",
    "type": "resident"
  },
  "resident": {
    "id": "resident_id",
    "fullName": "John Smith",
    "societyName": "Green Valley"
  }
}
```

### Step 2: Resident Books Amenity
```http
POST /api/amenity-bookings
Authorization: Bearer {resident_token}
Content-Type: application/json

{
  "amenityId": "amenity_object_id",
  "bookingDate": "2026-02-01",
  "startTime": "10:00",
  "endTime": "12:00",
  "purpose": "Family gathering",
  "numberOfGuests": 15
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
      "name": "Club House",
      "type": "Indoor"
    },
    "bookedBy": {
      "userType": "Resident",
      "userId": "resident_id",
      "name": "John Smith"
    },
    "bookingDate": "2026-02-01T00:00:00.000Z",
    "startTime": "10:00",
    "endTime": "12:00",
    "status": "Pending"
  }
}
```

---

## 👨‍👩‍👧‍👦 Family Member Amenity Booking

### Step 1: Add Family Member with Credentials
```http
POST /api/family-members
Content-Type: application/json

{
  "residentId": "resident_object_id",
  "name": "Sarah Smith",
  "relation": "Spouse",
  "age": 32,
  "email": "sarah.smith@email.com",
  "password": "secure123",
  "phone": "9876543210"
}
```

### Step 2: Admin Approves Family Member
```http
PUT /api/family-members/{family_member_id}/approve
Authorization: Bearer {admin_token}
```

### Step 3: Family Member Login
```http
POST /api/auth/family-member/login
Content-Type: application/json

{
  "email": "sarah.smith@email.com",
  "password": "secure123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "family_member_id",
    "name": "Sarah Smith",
    "email": "sarah.smith@email.com",
    "type": "family_member",
    "isApproved": true
  }
}
```

### Step 4: Family Member Books Amenity
```http
POST /api/amenity-bookings
Authorization: Bearer {family_member_token}
Content-Type: application/json

{
  "amenityId": "amenity_object_id",
  "bookingDate": "2026-02-05",
  "startTime": "14:00",
  "endTime": "16:00",
  "purpose": "Birthday party",
  "numberOfGuests": 20
}
```

**Response:**
```json
{
  "success": true,
  "message": "Amenity booking created successfully",
  "data": {
    "_id": "booking_id_2",
    "amenity": {
      "name": "Swimming Pool",
      "type": "Outdoor"
    },
    "bookedBy": {
      "userType": "FamilyMember",
      "userId": "family_member_id",
      "name": "Sarah Smith"
    },
    "bookingDate": "2026-02-05T00:00:00.000Z",
    "startTime": "14:00",
    "endTime": "16:00",
    "status": "Pending"
  }
}
```

---

## 📊 How the System Works

### Authentication Flow

```
┌─────────────────┐
│   Resident      │
│  (Head of       │
│   Family)       │
└────────┬────────┘
         │
         │ Login with Mobile/OTP
         ▼
┌─────────────────────────┐
│  JWT Token              │
│  type: "resident"       │
│  role: "resident"       │
└────────┬────────────────┘
         │
         │ Use Token
         ▼
┌─────────────────────────┐
│  Book Amenity           │
│  bookedBy.userType:     │
│  "Resident"             │
└─────────────────────────┘


┌─────────────────┐
│ Family Member   │
└────────┬────────┘
         │
         │ Login with Email/Password
         ▼
┌─────────────────────────┐
│  JWT Token              │
│  type: "family_member"  │
└────────┬────────────────┘
         │
         │ Use Token
         ▼
┌─────────────────────────┐
│  Book Amenity           │
│  bookedBy.userType:     │
│  "FamilyMember"         │
└─────────────────────────┘
```

### Booking Creation Logic

```javascript
// In POST /api/amenity-bookings

if (req.user.type === 'family_member') {
  // Family member booking
  bookedByType = 'FamilyMember';
  userId = req.user.id;
  // Fetch family member and related flat
  
} else if (req.user.type === 'resident' || req.user.role === 'resident') {
  // Resident booking
  bookedByType = 'Resident';
  // Fetch resident and related flat
}

// Create booking with correct userType
await AmenityBooking.create({
  bookedBy: {
    userType: bookedByType,
    userId: userId,
    name: bookerName
  },
  // ... other fields
});
```

---

## 🔍 View Bookings

### Resident Views Their Bookings
```http
GET /api/amenity-bookings/my-bookings?societyId={society_id}
Authorization: Bearer {resident_token}
```

### Family Member Views Their Bookings
```http
GET /api/amenity-bookings/my-bookings?societyId={society_id}
Authorization: Bearer {family_member_token}
```

### Admin Views All Bookings
```http
GET /api/amenity-bookings?societyId={society_id}
Authorization: Bearer {admin_token}
```

**Filter by Flat:**
```http
GET /api/amenity-bookings?societyId={society_id}&flatId={flat_id}
```

---

## 🏢 Same Flat, Multiple Bookers

A single flat can have multiple people booking amenities:

```
Flat 101A
  ├── John Smith (Resident/Owner)
  │   └── Can book amenities with mobile/OTP login
  │
  ├── Sarah Smith (Spouse)
  │   └── Can book amenities with email/password login
  │
  ├── Michael Smith (Son)
  │   └── Can book amenities with email/password login
  │
  └── Emma Smith (Daughter)
      └── Can book amenities with email/password login
```

All bookings are linked to the same flat but tracked separately by bookedBy.userId.

---

## 📋 Requirements Checklist

### For Resident to Book:
- ✅ Registered in system
- ✅ Admin approved (`approvedByAdmin: true`)
- ✅ Login with mobile/OTP
- ✅ Valid JWT token
- ✅ Linked to a flat

### For Family Member to Book:
- ✅ Added by resident
- ✅ Email and password set
- ✅ Admin approved (`isApproved: true`)
- ✅ Login enabled (`canLogin: true`)
- ✅ Login with email/password
- ✅ Valid JWT token
- ✅ Linked to resident (who is linked to flat)

---

## 🎯 Complete Example Scenario

### Scenario: Smith Family Books Different Amenities

**Family Setup:**
- John Smith - Resident/Owner (Flat 101A)
- Sarah Smith - Wife
- Michael Smith - Son (18 years old)

**Day 1: Setup**
1. John registers as resident → gets approved by admin
2. John adds Sarah as family member with email/password
3. John adds Michael as family member with email/password
4. Admin approves both family members

**Day 2: Bookings**
1. **Morning:** John (resident) books Club House for business meeting
2. **Afternoon:** Sarah (family member) books Swimming Pool for kids' party
3. **Evening:** Michael (family member) books Tennis Court for friends

**Result:**
- All 3 bookings linked to Flat 101A
- Each booking shows different bookedBy.userType and userId
- Admin can see all bookings from Flat 101A
- Each person can only see their own bookings via /my-bookings

---

## 🔒 Security & Permissions

### What Residents Can Do:
- ✅ Book amenities
- ✅ View their own bookings
- ✅ Cancel their own bookings
- ✅ Add family members
- ✅ View their family members

### What Family Members Can Do:
- ✅ Book amenities (if approved)
- ✅ View their own bookings
- ✅ Cancel their own bookings
- ❌ Cannot add other family members
- ❌ Cannot view other family members' bookings

### What Admins Can Do:
- ✅ View all bookings
- ✅ Approve/reject bookings
- ✅ Approve/reject family members
- ✅ View all residents and family members

---

## 📱 API Summary

| Endpoint | User Type | Purpose |
|----------|-----------|---------|
| `POST /api/auth/login-otp` | Resident | Resident login |
| `POST /api/auth/family-member/login` | Family Member | Family member login |
| `POST /api/amenity-bookings` | Both | Create booking |
| `GET /api/amenity-bookings/my-bookings` | Both | View own bookings |
| `PUT /api/amenity-bookings/:id/cancel` | Both | Cancel own booking |
| `POST /api/family-members` | Resident | Add family member |

---

## ✅ Testing Confirmation

The system is **ready and working** for:
- ✅ Resident (head of family) amenity booking
- ✅ Family member amenity booking
- ✅ Both using the same authenticated endpoint
- ✅ Proper tracking of who booked what
- ✅ Individual booking histories
- ✅ Admin oversight of all bookings

**Backend server is running successfully on your system!** 🎉
