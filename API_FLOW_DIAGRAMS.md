# API Flow Diagrams

## Flow 1: Basic Signup (Minimal Registration)

```
User Mobile App/Web
        │
        │ 1. Enter Mobile Number
        │ 2. Receive OTP (via SMS)
        │ 3. Enter OTP + Optional Username
        │
        ▼
POST /api/users/signup
{
  mobile: "9876543210",
  otp: "1234",
  username: "john_doe"
}
        │
        ▼
Authentication Service
        │
        ├──► Check if mobile exists ──► Yes ──► Return Error 400
        │                              No
        │                              ▼
        ├──► Create User Record
        │    {
        │      mobile, password: otp,
        │      registrationCompleted: false,
        │      status: "active"
        │    }
        │
        ├──► Save Notification (DB)
        │
        ├──► Send WebSocket to Admin Dashboard
        │    "New User Signup"
        │
        ├──► Generate JWT Token
        │
        ▼
Response
{
  success: true,
  token: "jwt_token",
  user: { id, mobile, registrationCompleted: false },
  resident: null
}
        │
        ▼
User Dashboard
(Can complete registration later)
```

---

## Flow 2: Complete Registration (One-Step)

```
User Mobile App/Web
        │
        │ 1. Enter Mobile Number
        │ 2. Receive OTP (via SMS)
        │ 3. Fill Complete Registration Form
        │    - Personal Details
        │    - Society Details
        │    - Family Members
        │    - Vehicles
        │    - Documents
        │
        ▼
POST /api/users/signup
{
  mobile: "9876543210",
  otp: "1234",
  username: "john_doe",
  residentData: {
    fullName: "John Doe",
    societyName: "Green Valley",
    flatNumber: "A-101",
    ownershipType: "Owner",
    // ... all other fields
  }
}
        │
        ▼
Authentication Service
        │
        ├──► Check if mobile exists ──► Yes ──► Return Error 400
        │                              No
        │                              ▼
        ├──► Create User Record
        │    {
        │      mobile, password: otp,
        │      registrationCompleted: true,
        │      status: "pending",
        │      role: "resident"
        │    }
        │
        ├──► Create Resident Profile
        │    {
        │      fullName, societyName, flatNumber,
        │      mobile, familyMembers, vehicles,
        │      isNewMember: false,
        │      registrationCompleted: true,
        │      approvedByAdmin: false
        │    }
        │
        ├──► Link User ──► Resident
        │
        ├──► Save Notification (DB)
        │
        ├──► Send WebSocket to Admin Dashboard
        │    "New Resident Registration - John Doe"
        │
        ├──► Generate JWT Token
        │
        ▼
Response
{
  success: true,
  token: "jwt_token",
  user: { 
    id, mobile, 
    registrationCompleted: true,
    status: "pending"
  },
  resident: { 
    id, fullName, societyName, 
    flatNumber, approvedByAdmin: false 
  }
}
        │
        ▼
User Dashboard
(Profile awaiting admin approval)
        │
        │
        ▼
Admin Dashboard
        │
        ├──► Receives Real-time Notification
        │    "New Resident: John Doe - A-101"
        │
        ├──► Reviews Profile
        │
        ├──► Approves/Rejects
        │
        ▼
User Status Updated
(status: "active", approvedByAdmin: true)
```

---

## Flow 3: Login Flow

```
User Mobile App/Web
        │
        │ 1. Enter Mobile Number
        │ 2. Receive OTP (via SMS)
        │ 3. Enter OTP
        │
        ▼
POST /api/users/login-otp
{
  mobile: "9876543210",
  otp: "1234"
}
        │
        ▼
Authentication Service
        │
        ├──► Find User by Mobile
        │
        ├──► Verify OTP matches password
        │    (if not) ──► Return Error 401
        │    (if yes)
        │    ▼
        ├──► Check if user is resident
        │    ├──► Yes ──► Fetch Resident Profile
        │    └──► No ──► resident = null
        │
        ├──► Generate JWT Token
        │
        ▼
Response
{
  success: true,
  token: "jwt_token",
  user: { 
    id, mobile, 
    registrationCompleted: true,
    status: "active",
    role: "resident"
  },
  resident: { 
    id, fullName, societyName, 
    flatNumber, approvedByAdmin: true 
  }
}
        │
        ▼
Frontend Logic
        │
        ├──► Store JWT Token
        │
        ├──► Check registrationCompleted?
        │    ├──► Yes + resident + approvedByAdmin
        │    │    └──► Redirect to Dashboard
        │    │
        │    ├──► Yes + resident + !approvedByAdmin
        │    │    └──► Show "Awaiting Approval" Message
        │    │
        │    └──► No
        │         └──► Redirect to Complete Registration Form
        │
        ▼
User Dashboard
```

---

## Flow 4: Database Schema Relationship

```
┌─────────────────────────┐
│       User Model        │
├─────────────────────────┤
│ _id                     │
│ mobile (unique)         │◄─────┐
│ username                │      │
│ password (OTP)          │      │
│ registrationCompleted   │      │
│ role: user/resident     │      │
│ status: active/pending  │      │
│ flat: ObjectId ────────┼──┐   │
│ society: ObjectId       │  │   │
│ lastLogin               │  │   │
│ createdAt               │  │   │
│ updatedAt               │  │   │
└─────────────────────────┘  │   │
                             │   │
                             │   │
┌─────────────────────────┐  │   │
│    Resident Model       │  │   │
├─────────────────────────┤  │   │
│ _id                     │◄─┘   │
│ mobile (unique)         │──────┘
│ fullName                │
│ gender                  │
│ dateOfBirth             │
│ email                   │
│ societyName             │
│ flatNumber              │
│ ownershipType           │
│ familyMembers: []       │
│ vehicles: []            │
│ documents: {}           │
│ isNewMember             │
│ registrationCompleted   │
│ approvedByAdmin         │
│ createdAt               │
│ updatedAt               │
└─────────────────────────┘
```

---

## Flow 5: Admin Approval Workflow

```
New Resident Registers
        │
        ▼
Resident Profile Created
{
  approvedByAdmin: false,
  registrationCompleted: true
}
        │
        ▼
User Status Set
{
  status: "pending"
}
        │
        ├──► Notification Created (DB)
        │
        └──► WebSocket Emitted
             to Admin Dashboard
        │
        ▼
┌─────────────────────────┐
│   Admin Dashboard       │
├─────────────────────────┤
│ 🔔 New Notification     │
│ "John Doe - A-101"      │
│ [Review] [Approve]      │
└─────────────────────────┘
        │
        │ Admin Clicks Review
        ▼
┌─────────────────────────┐
│  Resident Details View  │
├─────────────────────────┤
│ Name: John Doe          │
│ Flat: A-101             │
│ Type: Owner             │
│ Family: 3 members       │
│ Documents: ✓            │
│                         │
│ [✓ Approve] [✗ Reject] │
└─────────────────────────┘
        │
        │ Admin Approves
        ▼
PUT /api/residents/:id
{
  approvedByAdmin: true,
  approvedBy: "Admin Name",
  approvedAt: "2026-01-22T..."
}
        │
        ▼
Update User Status
{
  status: "active"
}
        │
        ▼
Send Notification to User
"Your profile has been approved!"
        │
        ▼
User Can Access Full Features
```

---

## Comparison: Old vs New Flow

### Old Flow (Multiple API Calls)
```
1. POST /api/users/signup-otp
   └──► Create User
   
2. POST /api/residents/complete-registration/:id
   └──► Create Resident Profile
   
3. POST /api/users/login-otp
   └──► Get User Data (no resident data)
   
4. GET /api/residents/by-mobile/:mobile
   └──► Get Resident Data
   
Total: 4 API calls for complete flow
```

### New Flow (Single API Call)
```
1. POST /api/users/signup
   ├──► Create User
   └──► Create Resident Profile
   └──► Return Both in Response
   
2. POST /api/users/login-otp
   └──► Return User + Resident Data
   
Total: 2 API calls for complete flow
```

**Result**: 50% reduction in API calls! 🚀
