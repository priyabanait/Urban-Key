# Two-Step Registration Flow

## Overview
User first signs up with OTP, then completes full registration using the same mobile number.

---

## API Endpoints

### 1. Signup (Step 1)
**POST** `/api/users/signup`

**Request:**
```json
{
  "mobile": "9876543210",
  "otp": "1234",
  "username": "john_doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Signup successful.",
  "token": "jwt_token_here",
  "user": {
    "id": "...",
    "mobile": "9876543210",
    "registrationCompleted": false,
    "status": "active"
  },
  "resident": null
}
```

---

### 2. Complete Registration (Step 2)
**POST** `/api/users/complete-registration`

**Request:**
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

**Response:**
```json
{
  "success": true,
  "message": "Registration completed successfully. Awaiting admin approval.",
  "token": "new_jwt_token_here",
  "user": {
    "id": "...",
    "mobile": "9876543210",
    "registrationCompleted": true,
    "status": "pending",
    "role": "resident"
  },
  "resident": {
    "id": "...",
    "fullName": "John Doe",
    "societyName": "Green Valley Apartments",
    "flatNumber": "A-101",
    "approvedByAdmin": false
  }
}
```

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                             │
└─────────────────────────────────────────────────────────────────┘

Step 1: SIGNUP
┌──────────────┐
│  User enters │
│   Mobile +   │
│     OTP      │
└──────┬───────┘
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
┌─────────────────┐
│  User Created   │
│  ✓ Mobile saved │
│  ✓ OTP verified │
│  ✗ Profile empty│
└────────┬────────┘
         │
         ▼
   User Dashboard
   (Basic account)


Step 2: COMPLETE REGISTRATION
┌──────────────┐
│  User fills  │
│   Complete   │
│    Profile   │
└──────┬───────┘
       │
       ▼
POST /api/users/complete-registration
{
  mobile: "9876543210",  ← SAME mobile!
  residentData: { ... }
}
       │
       ▼
┌──────────────────────┐
│  Profile Completed   │
│  ✓ Resident created  │
│  ✓ User updated      │
│  ✓ Admin notified    │
└──────┬───────────────┘
       │
       ▼
   Awaiting Admin Approval
   (Status: pending)
       │
       ▼
   Admin Approves
       │
       ▼
   Full Access
   (Status: active)
```

---

## Database Changes

### After Step 1 (Signup)
**User Collection:**
```javascript
{
  _id: "658a3b2c...",
  mobile: "9876543210",
  username: "john_doe",
  password: "1234",
  registrationCompleted: false,  // ← Not complete yet
  status: "active",
  role: "user"
}
```

**Resident Collection:**
```
(empty - no record yet)
```

---

### After Step 2 (Complete Registration)
**User Collection:**
```javascript
{
  _id: "658a3b2c...",
  mobile: "9876543210",
  username: "john_doe",
  password: "1234",
  registrationCompleted: true,   // ← Now complete!
  status: "pending",             // ← Awaiting approval
  role: "resident",              // ← Role updated
  flat: "658a3b2c...",          // ← Linked to resident
}
```

**Resident Collection:**
```javascript
{
  _id: "658a3b2c...",
  mobile: "9876543210",          // ← Same mobile
  fullName: "John Doe",
  societyName: "Green Valley Apartments",
  flatNumber: "A-101",
  ownershipType: "Owner",
  isNewMember: false,
  registrationCompleted: true,
  approvedByAdmin: false         // ← Awaiting approval
}
```

---

## Key Points

✅ **Same Mobile Number** - Both steps use the same mobile number to link records  
✅ **Step 1 Optional Later** - User can complete registration anytime after signup  
✅ **Validation** - Step 2 checks if user exists before creating resident profile  
✅ **No Duplicates** - System prevents duplicate registrations  
✅ **Real-time Notification** - Admin notified when registration is complete  
✅ **Token Update** - New JWT token issued after registration with updated role  

---

## Error Handling

| Error | Reason | Solution |
|-------|--------|----------|
| "User not found" | Step 2 called without Step 1 | Complete Step 1 first |
| "Registration already completed" | Trying to register twice | User already has profile |
| "Mobile already registered" | Duplicate signup | Use different mobile |
| "Resident profile already exists" | Duplicate resident | Contact support |

---

## Testing in Postman

### Test 1: Signup
```
POST http://localhost:5000/api/users/signup
Body: { "mobile": "9876543210", "otp": "1234", "username": "john_doe" }
```

### Test 2: Complete Registration (Same Mobile!)
```
POST http://localhost:5000/api/users/complete-registration
Body: { "mobile": "9876543210", "residentData": { ... } }
```

### Test 3: Login
```
POST http://localhost:5000/api/users/login-otp
Body: { "mobile": "9876543210", "otp": "1234" }
```

---

## Frontend Implementation

```javascript
// Step 1: Signup
const signup = async (mobile, otp, username) => {
  const response = await fetch('/api/users/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile, otp, username })
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('mobile', mobile); // Save for Step 2
    
    if (!data.user.registrationCompleted) {
      // Redirect to registration form
      window.location.href = '/complete-registration';
    }
  }
};

// Step 2: Complete Registration
const completeRegistration = async (residentData) => {
  const mobile = localStorage.getItem('mobile'); // Get saved mobile
  
  const response = await fetch('/api/users/complete-registration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile, residentData })
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('authToken', data.token); // Update token
    alert('Registration complete! Awaiting admin approval.');
    window.location.href = '/dashboard';
  }
};
```

---

## Summary

This two-step process provides:
1. **Quick Signup** - Users get account immediately with just OTP
2. **Flexible Registration** - Complete profile when ready
3. **Data Integrity** - Both records linked by mobile number
4. **Better UX** - Users not overwhelmed with long forms initially
5. **Admin Control** - Approval workflow for complete registrations
