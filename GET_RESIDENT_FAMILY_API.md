# Get Resident Family Details API

## Overview
These endpoints allow you to fetch family member details when clicking on a resident row in the admin panel.

---

## Endpoints for Getting Family Members by Resident

### 1. Get Resident with Family Details by ID
**GET** `/api/members/:id/with-family`

Get complete resident details along with all their family members.

**Usage:** When user clicks on a resident row, call this endpoint with the resident's ID.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "resident": {
      "_id": "507f1f77bcf86cd799439010",
      "fullName": "John Doe",
      "mobile": "8888277170",
      "email": "john.doe@example.com",
      "societyName": "Green Valley",
      "buildingName": "Tower A",
      "flatNumber": "A-101",
      "ownershipType": "Owner",
      "numberOfFamilyMembers": 3,
      "registrationCompleted": true,
      "approvedByAdmin": true,
      "createdAt": "2024-01-15T00:00:00.000Z"
    },
    "familyMembers": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jane Doe",
        "relation": "Spouse",
        "age": 32,
        "gender": "Female",
        "phone": "9876543210",
        "email": "jane@example.com",
        "photo": "https://example.com/jane.jpg",
        "isApproved": true,
        "flat": {
          "_id": "507f1f77bcf86cd799439011",
          "flatNo": "A-101",
          "tower": "Tower A"
        },
        "approvedBy": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Admin User"
        },
        "approvedAt": "2026-01-22T11:00:00.000Z",
        "createdAt": "2026-01-22T10:30:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Jimmy Doe",
        "relation": "Child",
        "age": 8,
        "gender": "Male",
        "isApproved": true,
        "flat": {
          "_id": "507f1f77bcf86cd799439011",
          "flatNo": "A-101",
          "tower": "Tower A"
        },
        "approvedBy": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Admin User"
        },
        "approvedAt": "2026-01-22T11:05:00.000Z",
        "createdAt": "2026-01-22T10:30:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Jenny Doe",
        "relation": "Child",
        "age": 5,
        "gender": "Female",
        "isApproved": false,
        "flat": {
          "_id": "507f1f77bcf86cd799439011",
          "flatNo": "A-101",
          "tower": "Tower A"
        },
        "createdAt": "2026-01-22T12:00:00.000Z"
      }
    ],
    "familyCount": {
      "total": 3,
      "approved": 2,
      "pending": 1
    }
  }
}
```

---

### 2. Get Family Members by Resident ID
**GET** `/api/family-members/by-resident/:residentId`

Get only family members for a specific resident.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "resident": {
      "_id": "507f1f77bcf86cd799439010",
      "fullName": "John Doe",
      "mobile": "8888277170",
      "email": "john.doe@example.com",
      "flatNumber": "A-101",
      "buildingName": "Tower A",
      "ownershipType": "Owner",
      "numberOfFamilyMembers": 3
    },
    "familyMembers": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jane Doe",
        "relation": "Spouse",
        "age": 32,
        "isApproved": true,
        // ... full family member details
      }
    ],
    "count": 3,
    "approved": 2,
    "pending": 1
  }
}
```

---

### 3. Get Family Members by Mobile Number
**GET** `/api/family-members/by-mobile/:mobile`

Get family members using the resident's mobile number.

**Example:**
```
GET /api/family-members/by-mobile/8888277170
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "resident": {
      "_id": "507f1f77bcf86cd799439010",
      "fullName": "John Doe",
      "mobile": "8888277170",
      "email": "john.doe@example.com",
      "flatNumber": "A-101",
      "ownershipType": "Owner"
    },
    "familyMembers": [
      // ... array of family members
    ],
    "count": 3
  }
}
```

---

## Frontend Integration Example

### JavaScript/React Example

```javascript
// When user clicks on a resident row
const handleResidentRowClick = async (residentId) => {
  try {
    const response = await fetch(
      `http://localhost:5000/api/members/${residentId}/with-family`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = await response.json();

    if (result.success) {
      const { resident, familyMembers, familyCount } = result.data;
      
      // Display resident details
      console.log('Resident:', resident.fullName);
      console.log('Total Family Members:', familyCount.total);
      console.log('Approved:', familyCount.approved);
      console.log('Pending:', familyCount.pending);
      
      // Display family members
      familyMembers.forEach(member => {
        console.log(`- ${member.name} (${member.relation}), Age: ${member.age}`);
        console.log(`  Status: ${member.isApproved ? 'Approved' : 'Pending'}`);
      });
      
      // Open modal or side panel with family details
      openFamilyDetailsModal(resident, familyMembers, familyCount);
    }
  } catch (error) {
    console.error('Error fetching family details:', error);
  }
};
```

### Using Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Authorization': `Bearer ${authToken}`
  }
});

// Get resident with family
const getResidentWithFamily = async (residentId) => {
  try {
    const { data } = await api.get(`/members/${residentId}/with-family`);
    return data.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
};

// Usage
const residentData = await getResidentWithFamily('507f1f77bcf86cd799439010');
console.log(residentData.resident);
console.log(residentData.familyMembers);
console.log(residentData.familyCount);
```

---

## React Component Example

```jsx
import React, { useState } from 'react';

const ResidentsTable = () => {
  const [selectedResident, setSelectedResident] = useState(null);
  const [familyDetails, setFamilyDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleRowClick = async (residentId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/members/${residentId}/with-family`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        }
      );

      const result = await response.json();

      if (result.success) {
        setSelectedResident(result.data.resident);
        setFamilyDetails(result.data);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Contact</th>
            <th>Flat</th>
            <th>Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {residents.map((resident) => (
            <tr 
              key={resident._id} 
              onClick={() => handleRowClick(resident._id)}
              style={{ cursor: 'pointer' }}
            >
              <td>{resident.fullName}</td>
              <td>{resident.mobile}</td>
              <td>{resident.flatNumber}</td>
              <td>{resident.ownershipType}</td>
              <td>{resident.approvedByAdmin ? 'Active' : 'Pending'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && familyDetails && (
        <FamilyDetailsModal
          resident={selectedResident}
          familyMembers={familyDetails.familyMembers}
          familyCount={familyDetails.familyCount}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

const FamilyDetailsModal = ({ resident, familyMembers, familyCount, onClose }) => {
  return (
    <div className="modal">
      <div className="modal-content">
        <h2>{resident.fullName}'s Family</h2>
        
        <div className="stats">
          <p>Total: {familyCount.total}</p>
          <p>Approved: {familyCount.approved}</p>
          <p>Pending: {familyCount.pending}</p>
        </div>

        <div className="family-list">
          <h3>Family Members</h3>
          {familyMembers.length === 0 ? (
            <p>No family members added yet</p>
          ) : (
            <ul>
              {familyMembers.map((member) => (
                <li key={member._id}>
                  <div>
                    <strong>{member.name}</strong>
                    <span>{member.relation}</span>
                  </div>
                  <div>
                    <span>Age: {member.age}</span>
                    <span>Gender: {member.gender}</span>
                  </div>
                  <div>
                    {member.phone && <span>Phone: {member.phone}</span>}
                    {member.email && <span>Email: {member.email}</span>}
                  </div>
                  <div>
                    Status: <span className={member.isApproved ? 'approved' : 'pending'}>
                      {member.isApproved ? 'Approved' : 'Pending Approval'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default ResidentsTable;
```

---

## Query Parameters

All endpoints support authentication via JWT token in the Authorization header.

**Authentication Required:** Yes

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

---

## Error Responses

### 404 - Resident Not Found
```json
{
  "success": false,
  "message": "Member not found"
}
```

### 500 - Server Error
```json
{
  "success": false,
  "message": "Server error"
}
```

---

## Summary

**Recommended Endpoint for Row Click:**
- **GET** `/api/members/:id/with-family` - Returns complete resident + family data in one call

**Alternative Options:**
- **GET** `/api/family-members/by-resident/:residentId` - Returns only family data with basic resident info
- **GET** `/api/family-members/by-mobile/:mobile` - Use if you only have mobile number

Choose the endpoint based on your UI needs:
- Use `/members/:id/with-family` if you want full resident details + family in one call
- Use `/family-members/by-resident/:residentId` if you already have resident details and only need family members
