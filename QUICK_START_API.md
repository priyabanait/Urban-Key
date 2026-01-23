# Quick Start Guide - Unified Signup & Registration API

## 🚀 Getting Started in 5 Minutes

### Step 1: Ensure Server is Running
```bash
cd backend
npm install
npm start
```
Server should be running on `http://localhost:5000`

---

## 📱 Test the API (Using curl or Postman)

### Test 1: Basic Signup (Quick Test)
```bash
curl -X POST http://localhost:5000/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "mobile": "9876543210",
    "otp": "1234",
    "username": "testuser"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Signup successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "testuser",
    "mobile": "9876543210",
    "registrationCompleted": false,
    "status": "active",
    "role": "user"
  },
  "resident": null
}
```

---

### Test 2: Complete Registration (Full Profile)
```bash
curl -X POST http://localhost:5000/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "mobile": "9876543211",
    "otp": "1234",
    "username": "john_doe",
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

**Expected Response:**
```json
{
  "success": true,
  "message": "Registration completed successfully. Awaiting admin approval.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "john_doe",
    "mobile": "9876543211",
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

### Test 3: Login
```bash
curl -X POST http://localhost:5000/api/users/login-otp \
  -H "Content-Type: application/json" \
  -d '{
    "mobile": "9876543211",
    "otp": "1234"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "john_doe",
    "mobile": "9876543211",
    "registrationCompleted": true,
    "status": "pending",
    "role": "resident"
  },
  "resident": {
    "id": "...",
    "fullName": "John Doe",
    "societyName": "Green Valley Apartments",
    "flatNumber": "A-101",
    "approvedByAdmin": false,
    "ownershipType": "Owner"
  }
}
```

---

## 🌐 Frontend Integration (React Example)

### Create API Service File
```javascript
// src/services/authService.js
const API_URL = 'http://localhost:5000/api/users';

export const signup = async (mobile, otp, username, residentData = null) => {
  try {
    const response = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, otp, username, residentData })
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.resident) {
        localStorage.setItem('resident', JSON.stringify(data.resident));
      }
    }
    
    return data;
  } catch (error) {
    return { success: false, message: 'Network error' };
  }
};

export const login = async (mobile, otp) => {
  try {
    const response = await fetch(`${API_URL}/login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, otp })
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.resident) {
        localStorage.setItem('resident', JSON.stringify(data.resident));
      }
    }
    
    return data;
  } catch (error) {
    return { success: false, message: 'Network error' };
  }
};
```

---

### Use in Component
```javascript
// src/components/SignupForm.jsx
import { useState } from 'react';
import { signup } from '../services/authService';

const SignupForm = () => {
  const [formData, setFormData] = useState({
    mobile: '',
    otp: '',
    username: '',
    fullName: '',
    societyName: '',
    flatNumber: '',
    ownershipType: 'Owner'
  });
  
  const [showFullForm, setShowFullForm] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const residentData = showFullForm ? {
      fullName: formData.fullName,
      societyName: formData.societyName,
      flatNumber: formData.flatNumber,
      ownershipType: formData.ownershipType
    } : null;
    
    const result = await signup(
      formData.mobile,
      formData.otp,
      formData.username,
      residentData
    );
    
    if (result.success) {
      alert(result.message);
      window.location.href = '/dashboard';
    } else {
      alert(result.message);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Basic Fields */}
      <input 
        type="tel" 
        placeholder="Mobile Number"
        value={formData.mobile}
        onChange={(e) => setFormData({...formData, mobile: e.target.value})}
        required
      />
      
      <input 
        type="text" 
        placeholder="OTP"
        value={formData.otp}
        onChange={(e) => setFormData({...formData, otp: e.target.value})}
        required
      />
      
      <input 
        type="text" 
        placeholder="Username"
        value={formData.username}
        onChange={(e) => setFormData({...formData, username: e.target.value})}
      />
      
      {/* Toggle Full Registration */}
      <label>
        <input 
          type="checkbox"
          checked={showFullForm}
          onChange={(e) => setShowFullForm(e.target.checked)}
        />
        Complete registration now
      </label>
      
      {/* Full Registration Fields */}
      {showFullForm && (
        <>
          <input 
            type="text" 
            placeholder="Full Name"
            value={formData.fullName}
            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            required
          />
          
          <input 
            type="text" 
            placeholder="Society Name"
            value={formData.societyName}
            onChange={(e) => setFormData({...formData, societyName: e.target.value})}
            required
          />
          
          <input 
            type="text" 
            placeholder="Flat Number"
            value={formData.flatNumber}
            onChange={(e) => setFormData({...formData, flatNumber: e.target.value})}
            required
          />
          
          <select 
            value={formData.ownershipType}
            onChange={(e) => setFormData({...formData, ownershipType: e.target.value})}
            required
          >
            <option value="Owner">Owner</option>
            <option value="Tenant">Tenant</option>
          </select>
        </>
      )}
      
      <button type="submit">
        {showFullForm ? 'Complete Registration' : 'Sign Up'}
      </button>
    </form>
  );
};

export default SignupForm;
```

---

## ✅ Checklist

- [ ] Backend server is running
- [ ] MongoDB is connected
- [ ] Test basic signup works
- [ ] Test complete registration works
- [ ] Test login returns resident data
- [ ] Frontend updated to use new endpoint
- [ ] Old signup-otp endpoint still works (backward compatibility)
- [ ] WebSocket notifications working for admin

---

## 🐛 Troubleshooting

### Issue: "Mobile number already registered"
**Solution**: Use a different mobile number or delete existing user from database
```bash
# In MongoDB
db.users.deleteOne({ mobile: "9876543210" })
db.societymembers.deleteOne({ mobile: "9876543210" })
```

### Issue: "Cannot read property 'io' of undefined"
**Solution**: Ensure Socket.IO is properly initialized in server.js
```javascript
// In server.js
app.locals.io = io;
```

### Issue: Resident data not returned on login
**Solution**: Ensure user.role is set to 'resident' or user.registrationCompleted is true

### Issue: No admin notifications
**Solution**: Check WebSocket connection and ensure admin is joined to 'dashboard' room

---

## 📚 Additional Resources

- **Full API Documentation**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Code Examples**: [USAGE_EXAMPLES.js](./USAGE_EXAMPLES.js)
- **Flow Diagrams**: [API_FLOW_DIAGRAMS.md](./API_FLOW_DIAGRAMS.md)
- **Implementation Details**: [UNIFIED_API_SUMMARY.md](./UNIFIED_API_SUMMARY.md)

---

## 🎯 Next Steps

1. **Integrate with Frontend**
   - Update signup page to use new `/api/users/signup` endpoint
   - Add optional complete registration section
   - Handle new response format

2. **Add Real OTP Service**
   - Integrate Twilio, MSG91, or other SMS gateway
   - Generate random OTP instead of user input
   - Add OTP expiry and retry logic

3. **Enhance Security**
   - Add rate limiting for signup/login
   - Implement bcrypt for password hashing
   - Add CAPTCHA for bot prevention

4. **Admin Dashboard**
   - Add approval/rejection interface
   - Real-time notifications display
   - Resident profile review page

---

## 💡 Pro Tips

1. **Use the complete registration flow** when possible - it provides better UX
2. **Store JWT token securely** - use httpOnly cookies in production
3. **Handle approval status** - show appropriate messages to users awaiting approval
4. **Test with real mobile numbers** once OTP service is integrated
5. **Monitor notifications** - ensure admins receive and can act on new registrations

---

## 🚀 You're All Set!

The unified signup & registration API is ready to use. Start with the basic tests above, then integrate with your frontend application.

**Happy Coding!** 🎉
