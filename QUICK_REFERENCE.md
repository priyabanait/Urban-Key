# Family Member Amenity Booking - Quick Reference Card

## 🔑 Authentication

### Family Member Login
```http
POST /api/auth/family-member/login
{
  "email": "member@example.com",
  "password": "password123"
}
```
**Returns:** JWT token with `type: 'family_member'`

### Set Credentials (First Time)
```http
POST /api/auth/family-member/set-credentials
{
  "familyMemberId": "...",
  "email": "member@example.com",
  "password": "password123"
}
```

---

## 👨‍👩‍👧‍👦 Family Member Management

### Add Family Member (with credentials)
```http
POST /api/family-members
{
  "residentId": "...",
  "name": "John Doe",
  "relation": "Spouse",
  "email": "john@example.com",      // Optional
  "password": "secure123",           // Optional
  "age": 35,
  "gender": "Male",
  "phone": "9876543210"
}
```

### Approve Family Member (Admin)
```http
PUT /api/family-members/{id}/approve
Authorization: Bearer {admin_token}
```

---

## 🏊 Amenity Booking

### Create Booking (Authenticated)
```http
POST /api/amenity-bookings
Authorization: Bearer {family_member_token}
{
  "amenityId": "...",
  "bookingDate": "2026-02-01",
  "startTime": "14:00",
  "endTime": "16:00",
  "purpose": "Party",
  "numberOfGuests": 20
}
```

### Get My Bookings
```http
GET /api/amenity-bookings/my-bookings?societyId=...
Authorization: Bearer {family_member_token}
```

---

## 📋 Requirements

### To Login:
- ✅ Email set
- ✅ Password set  
- ✅ `canLogin: true`
- ✅ `isApproved: true`

### To Book Amenity:
- ✅ Valid JWT token
- ✅ `isApproved: true`
- ✅ Amenity available
- ✅ No time slot conflict

---

## 🔒 Security Notes

- Passwords are hashed with bcrypt
- Email must be unique
- Password minimum 6 characters
- JWT expires in 30 days
- Admin approval required

---

## 📊 Database Fields

### FamilyMember Model
```javascript
{
  email: String (unique),
  password: String (hashed),
  canLogin: Boolean,
  isApproved: Boolean,
  lastLogin: Date
}
```

### AmenityBooking.bookedBy
```javascript
{
  userType: 'FamilyMember' | 'Resident',
  userId: ObjectId,
  name: String
}
```

---

## ⚠️ Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Your account is pending approval" | `isApproved: false` | Admin must approve |
| "Login is not enabled" | `canLogin: false` | Set email/password |
| "Invalid email or password" | Wrong credentials | Check email/password |
| "Email already registered" | Duplicate email | Use different email |
| "Time slot already booked" | Booking conflict | Choose different time |

---

## 🎯 Quick Test

1. Add family member with credentials
2. Admin approves
3. Family member logs in → gets token
4. Use token to create booking
5. View bookings with same token

**All done! ✨**
