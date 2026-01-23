# Test Amenity Booking API (Updated)

## Endpoint
`POST http://localhost:5000/api/amenity-bookings`

## Updated Request Format

The API now accepts **buildingName**, **flatNo**, and **personName** instead of the previous `bookedByType`, `bookedById`, and just `flatNo`.

### Required Fields
- `amenityId` - ID of the amenity to book
- `bookingDate` - Date in YYYY-MM-DD format
- `startTime` - Start time in HH:MM format (24-hour)
- `endTime` - End time in HH:MM format (24-hour)
- `buildingName` - Name of the tower/building
- `flatNo` - Flat number
- `personName` - Name of the person making the booking

### Optional Fields
- `purpose` - Purpose of booking
- `numberOfGuests` - Number of guests

## Example Request

### Using cURL
```bash
curl -X POST http://localhost:5000/api/amenity-bookings \
  -H "Content-Type: application/json" \
  -d '{
    "amenityId": "YOUR_AMENITY_ID",
    "bookingDate": "2026-01-25",
    "startTime": "10:00",
    "endTime": "12:00",
    "buildingName": "Tower A",
    "flatNo": "101",
    "personName": "John Doe",
    "purpose": "Birthday party",
    "numberOfGuests": 20
  }'
```

### Using JavaScript (fetch)
```javascript
fetch('http://localhost:5000/api/amenity-bookings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amenityId: 'YOUR_AMENITY_ID',
    bookingDate: '2026-01-25',
    startTime: '10:00',
    endTime: '12:00',
    buildingName: 'Tower A',
    flatNo: '101',
    personName: 'John Doe',
    purpose: 'Birthday party',
    numberOfGuests: 20
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### Using Postman
1. Method: **POST**
2. URL: `http://localhost:5000/api/amenity-bookings`
3. Headers:
   - `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "amenityId": "YOUR_AMENITY_ID",
  "bookingDate": "2026-01-25",
  "startTime": "10:00",
  "endTime": "12:00",
  "buildingName": "Tower A",
  "flatNo": "101",
  "personName": "John Doe",
  "purpose": "Birthday party",
  "numberOfGuests": 20
}
```

## How It Works

1. **Building Lookup**: The API finds the tower/building by the `buildingName`
2. **Flat Lookup**: It then finds the flat using both `flatNo` and the tower ID
3. **Person Identification**: The API automatically determines if `personName` is:
   - A resident of the flat
   - An approved family member of the resident
   - If neither, it still allows the booking with the provided name
4. **Booking Creation**: Creates the booking with all the details

## Success Response
```json
{
  "success": true,
  "message": "Amenity booking created successfully",
  "data": {
    "_id": "booking_id",
    "amenity": "amenity_id",
    "society": "society_id",
    "flat": "flat_id",
    "bookedBy": {
      "userType": "Resident",
      "userId": "user_id",
      "name": "John Doe"
    },
    "bookingDate": "2026-01-25T00:00:00.000Z",
    "startTime": "10:00",
    "endTime": "12:00",
    "duration": 2,
    "purpose": "Birthday party",
    "numberOfGuests": 20,
    "status": "Pending",
    "createdAt": "2026-01-23T...",
    "updatedAt": "2026-01-23T..."
  }
}
```

## Error Responses

### Missing Required Fields
```json
{
  "success": false,
  "message": "Missing required fields",
  "missing": ["buildingName", "flatNo"]
}
```

### Building Not Found
```json
{
  "success": false,
  "message": "Building/Tower not found with name: Tower A"
}
```

### Flat Not Found
```json
{
  "success": false,
  "message": "Flat 101 not found in building Tower A"
}
```

### Amenity Not Found
```json
{
  "success": false,
  "message": "Amenity not found or inactive"
}
```

### Invalid Time
```json
{
  "success": false,
  "message": "End time must be after start time"
}
```

## Notes
- Building names and person names are case-insensitive
- The API will automatically match the person to resident or family member
- Bookings are created with status "Pending" and need admin approval
- Make sure you have towers, flats, and amenities set up in your database before testing
