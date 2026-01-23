# Family Members API Documentation

## Overview
This API allows residents to register and manage their family members. One person (primary resident) can add multiple family members to their household. All family member additions require admin approval.

## Base URL
```
/api/family-members
```

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Add Single Family Member
**POST** `/api/family-members`

Add a single family member to your household.

**Request Body:**
```json
{
  "name": "John Doe",
  "relation": "Spouse",
  "age": 35,
  "gender": "Male",
  "phone": "9876543210",
  "email": "john@example.com",
  "photo": "https://example.com/photo.jpg",
  "flatId": "507f1f77bcf86cd799439011"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Family member added successfully. Pending admin approval.",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "resident": {
      "_id": "507f1f77bcf86cd799439010",
      "fullName": "Primary Resident",
      "mobile": "9876543210"
    },
    "flat": {
      "_id": "507f1f77bcf86cd799439011",
      "flatNo": "A-101",
      "tower": "Tower A"
    },
    "name": "John Doe",
    "relation": "Spouse",
    "age": 35,
    "gender": "Male",
    "phone": "9876543210",
    "email": "john@example.com",
    "photo": "https://example.com/photo.jpg",
    "isApproved": false,
    "createdAt": "2026-01-22T10:30:00.000Z",
    "updatedAt": "2026-01-22T10:30:00.000Z"
  }
}
```

**Field Validations:**
- `name`: Required, string
- `relation`: Required, enum ['Spouse', 'Child', 'Parent', 'Sibling', 'Other']
- `flatId`: Required, valid ObjectId
- `age`: Optional, number >= 0
- `gender`: Optional, enum ['Male', 'Female', 'Other']
- `phone`: Optional, string
- `email`: Optional, string (will be converted to lowercase)
- `photo`: Optional, string (URL)

---

### 2. Add Multiple Family Members (Bulk)
**POST** `/api/family-members/bulk`

Add multiple family members at once.

**Request Body:**
```json
{
  "flatId": "507f1f77bcf86cd799439011",
  "familyMembers": [
    {
      "name": "Jane Doe",
      "relation": "Spouse",
      "age": 33,
      "gender": "Female",
      "phone": "9876543211",
      "email": "jane@example.com"
    },
    {
      "name": "Jimmy Doe",
      "relation": "Child",
      "age": 8,
      "gender": "Male"
    },
    {
      "name": "Jenny Doe",
      "relation": "Child",
      "age": 5,
      "gender": "Female"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "3 family members added successfully. Pending admin approval.",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "resident": {
        "_id": "507f1f77bcf86cd799439010",
        "fullName": "Primary Resident",
        "mobile": "9876543210"
      },
      "flat": {
        "_id": "507f1f77bcf86cd799439011",
        "flatNo": "A-101",
        "tower": "Tower A"
      },
      "name": "Jane Doe",
      "relation": "Spouse",
      "age": 33,
      "gender": "Female",
      "phone": "9876543211",
      "email": "jane@example.com",
      "isApproved": false,
      "createdAt": "2026-01-22T10:30:00.000Z"
    },
    // ... other members
  ],
  "count": 3
}
```

---

### 3. Get My Family Members
**GET** `/api/family-members/my-family`

Get all family members added by the logged-in resident.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Jane Doe",
      "relation": "Spouse",
      "age": 33,
      "gender": "Female",
      "phone": "9876543211",
      "email": "jane@example.com",
      "isApproved": true,
      "flat": {
        "_id": "507f1f77bcf86cd799439011",
        "flatNo": "A-101",
        "tower": "Tower A"
      },
      "createdAt": "2026-01-22T10:30:00.000Z"
    },
    // ... other members
  ],
  "count": 3
}
```

---

### 4. Get All Family Members (Admin)
**GET** `/api/family-members`

Get all family members with optional filters (Admin access).

**Query Parameters:**
- `status`: Filter by approval status ('approved' | 'pending')
- `flatId`: Filter by flat ID
- `residentId`: Filter by resident ID

**Examples:**
```
GET /api/family-members?status=pending
GET /api/family-members?flatId=507f1f77bcf86cd799439011
GET /api/family-members?residentId=507f1f77bcf86cd799439010&status=approved
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "resident": {
        "_id": "507f1f77bcf86cd799439010",
        "fullName": "Primary Resident",
        "mobile": "9876543210"
      },
      "flat": {
        "_id": "507f1f77bcf86cd799439011",
        "flatNo": "A-101",
        "tower": "Tower A"
      },
      "name": "Jane Doe",
      "relation": "Spouse",
      "age": 33,
      "isApproved": true,
      "approvedBy": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Admin User"
      },
      "approvedAt": "2026-01-22T11:00:00.000Z",
      "createdAt": "2026-01-22T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 5. Get Single Family Member
**GET** `/api/family-members/:id`

Get details of a specific family member.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "resident": {
      "_id": "507f1f77bcf86cd799439010",
      "fullName": "Primary Resident",
      "mobile": "9876543210"
    },
    "flat": {
      "_id": "507f1f77bcf86cd799439011",
      "flatNo": "A-101",
      "tower": "Tower A"
    },
    "name": "Jane Doe",
    "relation": "Spouse",
    "age": 33,
    "gender": "Female",
    "phone": "9876543211",
    "email": "jane@example.com",
    "photo": "https://example.com/photo.jpg",
    "isApproved": true,
    "approvedBy": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Admin User"
    },
    "approvedAt": "2026-01-22T11:00:00.000Z",
    "createdAt": "2026-01-22T10:30:00.000Z"
  }
}
```

---

### 6. Update Family Member
**PUT** `/api/family-members/:id`

Update a family member's details.

**Request Body:**
```json
{
  "name": "Jane Doe Updated",
  "age": 34,
  "phone": "9876543299",
  "email": "jane.new@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Family member updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Jane Doe Updated",
    "age": 34,
    "phone": "9876543299",
    "email": "jane.new@example.com",
    // ... other fields
  }
}
```

---

### 7. Delete Family Member
**DELETE** `/api/family-members/:id`

Delete a family member.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Family member deleted successfully"
}
```

---

### 8. Approve Family Member (Admin)
**PUT** `/api/family-members/:id/approve`

Approve a pending family member (Admin only).

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Family member approved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Jane Doe",
    "isApproved": true,
    "approvedBy": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Admin User"
    },
    "approvedAt": "2026-01-22T11:00:00.000Z",
    // ... other fields
  }
}
```

---

### 9. Reject Family Member (Admin)
**PUT** `/api/family-members/:id/reject`

Reject and delete a pending family member (Admin only).

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Family member rejected and removed"
}
```

---

### 10. Get Family Members Count
**GET** `/api/family-members/count/:residentId`

Get the count of approved family members for a specific resident.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "count": 3
  }
}
```

---

## Integration with Existing Approval System

The family members are also integrated with the existing approval routes:

### Get Pending Approvals
**GET** `/api/approvals/pending`

Returns family members along with other pending approvals (vehicles, maids).

### Approve via Approval Routes
**PUT** `/api/approvals/family/:id/approve`

Alternative endpoint for approving family members.

### Reject via Approval Routes
**DELETE** `/api/approvals/family/:id`

Alternative endpoint for rejecting family members.

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Name, relation, and flat ID are required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Family member not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to add family member",
  "error": "Detailed error message"
}
```

---

## Usage Flow

### For Residents:

1. **During Registration:**
   - Complete resident registration via `/api/members/complete-registration/:id`
   - After registration is approved, add family members

2. **Add Family Members:**
   - Single: `POST /api/family-members`
   - Multiple: `POST /api/family-members/bulk`

3. **View Family:**
   - Get all your family members: `GET /api/family-members/my-family`

4. **Update/Delete:**
   - Update a member: `PUT /api/family-members/:id`
   - Delete a member: `DELETE /api/family-members/:id`

### For Admins:

1. **View Pending Approvals:**
   - `GET /api/approvals/pending`
   - `GET /api/family-members?status=pending`

2. **Approve/Reject:**
   - Approve: `PUT /api/family-members/:id/approve`
   - Reject: `PUT /api/family-members/:id/reject`

3. **View All:**
   - `GET /api/family-members`
   - Filter by flat, resident, or status as needed

---

## Database Schema

### FamilyMember Model
```javascript
{
  resident: ObjectId (ref: 'Resident') - Required
  flat: ObjectId (ref: 'Flat') - Required
  name: String - Required
  relation: String - Required (Spouse/Child/Parent/Sibling/Other)
  age: Number
  gender: String (Male/Female/Other)
  email: String
  phone: String
  photo: String (URL)
  isApproved: Boolean (default: false)
  approvedBy: ObjectId (ref: 'User')
  approvedAt: Date
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

---

## Notes

1. All family member additions require admin approval before they're fully active
2. The primary resident (who adds family members) must be authenticated
3. Family members are linked to both the resident and the flat
4. Soft delete is not implemented - deletion is permanent
5. Photo URLs should be uploaded to a file storage service first
6. Email addresses are automatically converted to lowercase
7. The relation field is strictly validated against the enum values
