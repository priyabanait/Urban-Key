# Amenity Booking API Documentation

## Overview
This API allows residents and their family members to book amenities in the society. Family members must be approved before they can make bookings.

## Base URL
`http://localhost:5000/api`

---

## Models

### AmenityBooking Model
```javascript
{
  amenity: ObjectId (ref: Amenity),
  society: ObjectId (ref: Society),
  flat: ObjectId (ref: Flat),
  bookedBy: {
    userType: 'Resident' | 'FamilyMember',
    userId: ObjectId,
    name: String
  },
  bookingDate: Date,
  startTime: String, // Format: "HH:MM"
  endTime: String,
  duration: Number, // in hours
  purpose: String,
  numberOfGuests: Number,
  charges: Number,
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded',
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Completed'
}
```

---

## Endpoints

### 1. Create Amenity Booking
**POST** `/api/amenity-bookings`

Create a new booking for an amenity. Can be created by a resident or their family member.

#### Request Body
```json
{
  "amenityId": "6789abc123def456",
  "bookingDate": "2026-01-25",
  "startTime": "10:00",
  "endTime": "12:00",
  "purpose": "Birthday party",
  "numberOfGuests": 20,
  "bookedByType": "FamilyMember",
  "bookedById": "abc123def456789",
  "flatNo": "101"
}
```

#### Required Fields
- `amenityId`: ID of the amenity to book
- `bookingDate`: Date of booking (YYYY-MM-DD)
- `startTime`: Start time (HH:MM)
- `endTime`: End time (HH:MM)
- `bookedByType`: Either "Resident" or "FamilyMember"
- `bookedById`: ID of the resident or family member
- `flatNo`: Flat number (e.g., "101", "A-201")

#### Response
```json
{
  "success": true,
  "message": "Amenity booking created successfully",
  "data": {
    "_id": "booking123",
    "amenity": {
      "_id": "amenity123",
      "name": "Club House",
      "type": "Party Hall"
    },
    "bookedBy": {
      "userType": "FamilyMember",
      "userId": "abc123",
      "name": "John Doe"
    },
    "bookingDate": "2026-01-25T00:00:00.000Z",
    "startTime": "10:00",
    "endTime": "12:00",
    "duration": 2,
    "charges": 1000,
    "status": "Pending"
  }
}
```

#### Validations
- Amenity must exist and be active
- Booking must be required for the amenity
- End time must be after start time
- Cannot book for past dates
- Checks maximum duration limits (if set)
- Checks advance booking days limit (if set)
- Family members must be approved
- Checks for time slot conflicts

---

### 2. Get All Bookings
**GET** `/api/amenity-bookings`

Fetch all bookings with optional filters.

#### Query Parameters
- `amenityId`: Filter by amenity
- `status`: Filter by status
- `startDate`: Filter bookings from this date
- `endDate`: Filter bookings until this date
- `flatId`: Filter by flat

#### Example
```
GET /api/amenity-bookings?status=Approved&amenityId=amenity123
```

#### Response
```json
{
  "success": true,
  "count": 5,
  "data": [...]
}
```

---

### 3. Get My Bookings
**GET** `/api/amenity-bookings/my-bookings`

Get bookings for a specific resident or family member.

#### Query Parameters (Required)
- `userType`: "Resident" or "FamilyMember"
- `userId`: ID of the resident or family member

#### Example
```
GET /api/amenity-bookings/my-bookings?userType=FamilyMember&userId=abc123
```

---

### 4. Get Single Booking
**GET** `/api/amenity-bookings/:id`

Get details of a specific booking.

#### Response
```json
{
  "success": true,
  "data": {
    "_id": "booking123",
    "amenity": {...},
    "flat": {...},
    "bookedBy": {...},
    "status": "Approved",
    ...
  }
}
```

---

### 5. Update Booking Status (Admin)
**PUT** `/api/amenity-bookings/:id/status`

Approve or reject a pending booking (Admin only).

#### Request Body
```json
{
  "status": "Approved",
  "notes": "Approved for 2 hours"
}
```

OR

```json
{
  "status": "Rejected",
  "rejectionReason": "Amenity under maintenance"
}
```

#### Response
```json
{
  "success": true,
  "message": "Booking approved successfully",
  "data": {...}
}
```

---

### 6. Cancel Booking
**PUT** `/api/amenity-bookings/:id/cancel`

Cancel a pending or approved booking.

#### Request Body
```json
{
  "cancellationReason": "Plans changed"
}
```

#### Response
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {...}
}
```

#### Note
Only bookings with status "Pending" or "Approved" can be cancelled.

---

### 7. Get Available Slots
**GET** `/api/amenity-bookings/available-slots/:amenityId`

Get booked time slots for a specific amenity and date.

#### Query Parameters (Required)
- `date`: Date to check (YYYY-MM-DD)

#### Example
```
GET /api/amenity-bookings/available-slots/amenity123?date=2026-01-25
```

#### Response
```json
{
  "success": true,
  "data": {
    "amenity": {
      "name": "Club House",
      "timings": {
        "openTime": "08:00",
        "closeTime": "22:00"
      }
    },
    "bookedSlots": [
      {
        "startTime": "10:00",
        "endTime": "12:00"
      },
      {
        "startTime": "15:00",
        "endTime": "18:00"
      }
    ],
    "date": "2026-01-25"
  }
}
```

---

## Integration with Family Members

### How Family Members Book Amenities

1. **Add Family Member**
   ```
   POST /api/family-members
   {
     "name": "John Doe",
     "relation": "Son",
     "residentId": "resident123"
   }
   ```

2. **Admin Approves Family Member**
   ```
   PUT /api/family-members/:id/approve
   ```

3. **Family Member Books Amenity**
   ```
   POST /api/amenity-bookings
   {
     "amenityId": "amenity123",
     "bookingDate": "2026-01-25",
     "startTime": "10:00",
     "endTime": "12:00",
     "bookedByType": "FamilyMember",
     "bookedById": "familyMember123",
     "flatNo": "101"
   }
   ```

### Family Member Workflow
1. Resident adds family member
2. Family member gets approved by admin
3. Family member can now book amenities
4. Booking appears under the flat/resident

---

## Frontend Integration

### Example: Booking Modal Component

```jsx
import api from '../utils/api';

const bookAmenity = async (amenityId, familyMemberId, flatNo) => {
  try {
    const response = await api.post('/api/amenity-bookings', {
      amenityId: amenityId,
      bookingDate: '2026-01-25',
      startTime: '10:00',
      endTime: '12:00',
      purpose: 'Family gathering',
      numberOfGuests: 10,
      bookedByType: 'FamilyMember',
      bookedById: familyMemberId,
      flatNo: flatNo
    });
    
    if (response.success) {
      alert('Booking created successfully!');
    }
  } catch (error) {
    alert(error.message);
  }
};
```

### Fetch Family Members for Booking
```jsx
const fetchFamilyMembers = async () => {
  const response = await api.get('/api/family-members');
  const approvedMembers = response.data.filter(fm => fm.isApproved);
  setFamilyMembers(approvedMembers);
};
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 201 | Booking created successfully |
| 400 | Bad request (validation error) |
| 403 | Forbidden (family member not approved) |
| 404 | Amenity/Booking not found |
| 409 | Conflict (time slot already booked) |
| 500 | Server error |

---

## Business Rules

1. **Booking Validation**
   - Past dates cannot be booked
   - End time must be after start time
   - Respects maximum duration limits
   - Respects advance booking days

2. **Family Member Booking**
   - Family member must be approved
   - Booking is linked to the resident's flat
   - Family member name is stored for reference

3. **Time Slot Conflicts**
   - System checks for overlapping bookings
   - Only one booking per time slot per amenity

4. **Charges**
   - Automatically calculated based on duration
   - Uses booking rules from amenity settings

5. **Status Flow**
   - Pending → Approved/Rejected
   - Approved → Completed/Cancelled
   - Pending → Cancelled

---

## Testing Checklist

- [ ] Resident can book amenity
- [ ] Family member can book amenity (if approved)
- [ ] Unapproved family member cannot book
- [ ] Cannot book overlapping time slots
- [ ] Cannot book past dates
- [ ] Charges calculated correctly
- [ ] Booking can be cancelled
- [ ] Admin can approve/reject bookings
- [ ] Available slots API works correctly
