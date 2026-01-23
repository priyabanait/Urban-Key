/**
 * Example: How to use the Unified Signup & Registration API
 * 
 * These are example HTTP requests showing how to use the new single API endpoint
 */

// ========================================
// Example 1: Basic Signup (OTP only)
// ========================================

// Request
fetch('http://localhost:5000/api/users/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    mobile: '9876543210',
    otp: '1234',
    username: 'john_doe' // optional
  })
})
.then(response => response.json())
.then(data => {
  console.log('Signup Success:', data);
  // Store the token
  localStorage.setItem('authToken', data.token);
  // User can complete registration later
})
.catch(error => console.error('Error:', error));

// Expected Response:
// {
//   "success": true,
//   "message": "Signup successful.",
//   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
//   "user": {
//     "id": "64f5a1b2c3d4e5f6g7h8i9j0",
//     "username": "john_doe",
//     "mobile": "9876543210",
//     "registrationCompleted": false,
//     "status": "active",
//     "role": "user"
//   },
//   "resident": null
// }


// ========================================
// Example 2: Complete Registration (One-step)
// ========================================

// Request
fetch('http://localhost:5000/api/users/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    mobile: '9876543210',
    otp: '1234',
    username: 'john_doe',
    residentData: {
      // Personal Details
      fullName: 'John Doe',
      gender: 'Male',
      dateOfBirth: '1990-05-15',
      email: 'john@example.com',
      alternateMobile: '9123456789',
      governmentIdNumber: 'ABCD1234E',
      
      // Society Details
      societyName: 'Green Valley Apartments',
      buildingName: 'Tower A',
      flatNumber: 'A-101',
      floorNumber: 1,
      flatType: '2 BHK',
      ownershipType: 'Owner', // or 'Tenant'
      moveInDate: '2024-01-15',
      
      // Family Details
      numberOfFamilyMembers: 3,
      familyMembers: [
        {
          name: 'Jane Doe',
          relation: 'Spouse',
          age: 28
        },
        {
          name: 'Baby Doe',
          relation: 'Child',
          age: 2
        }
      ],
      emergencyContactName: 'Emergency Contact',
      emergencyContactNumber: '9999888877',
      
      // Vehicles
      vehicles: [
        {
          vehicleType: 'Four Wheeler',
          vehicleNumber: 'MH01AB1234',
          parkingSlotNumber: 'P-15'
        }
      ],
      
      // Documents (upload separately and provide URLs)
      documents: {
        idProof: 'https://example.com/uploads/id-proof.pdf',
        addressProof: 'https://example.com/uploads/address-proof.pdf',
        photo: 'https://example.com/uploads/photo.jpg'
      },
      
      remarks: 'New resident registration'
    }
  })
})
.then(response => response.json())
.then(data => {
  console.log('Registration Success:', data);
  // Store the token
  localStorage.setItem('authToken', data.token);
  // Show success message and redirect
  alert(data.message); // "Registration completed successfully. Awaiting admin approval."
  window.location.href = '/dashboard';
})
.catch(error => console.error('Error:', error));

// Expected Response:
// {
//   "success": true,
//   "message": "Registration completed successfully. Awaiting admin approval.",
//   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
//   "user": {
//     "id": "64f5a1b2c3d4e5f6g7h8i9j0",
//     "username": "john_doe",
//     "mobile": "9876543210",
//     "registrationCompleted": true,
//     "status": "pending",
//     "role": "resident"
//   },
//   "resident": {
//     "id": "64f5a1b2c3d4e5f6g7h8i9j1",
//     "fullName": "John Doe",
//     "societyName": "Green Valley Apartments",
//     "flatNumber": "A-101",
//     "approvedByAdmin": false
//   }
// }


// ========================================
// Example 3: Login after Registration
// ========================================

fetch('http://localhost:5000/api/users/login-otp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    mobile: '9876543210',
    otp: '1234'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Login Success:', data);
  localStorage.setItem('authToken', data.token);
  
  // Check if user has completed registration
  if (data.user.registrationCompleted && data.resident) {
    console.log('Welcome back, ' + data.resident.fullName);
    window.location.href = '/dashboard';
  } else {
    console.log('Please complete your registration');
    window.location.href = '/complete-registration';
  }
})
.catch(error => console.error('Error:', error));


// ========================================
// Example 4: React/Next.js Implementation
// ========================================

// signup.js (React Component)
const handleCompleteSignup = async (formData) => {
  try {
    const response = await fetch('http://localhost:5000/api/users/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mobile: formData.mobile,
        otp: formData.otp,
        username: formData.username,
        residentData: {
          fullName: formData.fullName,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          email: formData.email,
          societyName: formData.societyName,
          flatNumber: formData.flatNumber,
          ownershipType: formData.ownershipType,
          // ... all other fields
        }
      })
    });

    const data = await response.json();

    if (data.success) {
      // Store token
      localStorage.setItem('authToken', data.token);
      
      // Show success message
      toast.success(data.message);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } else {
      toast.error(data.message);
    }
  } catch (error) {
    console.error('Signup error:', error);
    toast.error('An error occurred during signup');
  }
};


// ========================================
// Example 5: Axios Implementation
// ========================================

import axios from 'axios';

const API_URL = 'http://localhost:5000/api/users';

// Complete Signup & Registration
export const completeSignup = async (mobile, otp, username, residentData) => {
  try {
    const response = await axios.post(`${API_URL}/signup`, {
      mobile,
      otp,
      username,
      residentData
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Signup failed'
    };
  }
};

// Login
export const login = async (mobile, otp) => {
  try {
    const response = await axios.post(`${API_URL}/login-otp`, {
      mobile,
      otp
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Login failed'
    };
  }
};


// ========================================
// Example 6: Error Handling
// ========================================

fetch('http://localhost:5000/api/users/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    mobile: '9876543210',
    otp: '1234',
    residentData: { /* ... */ }
  })
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('✅ Success:', data.message);
    // Handle success
  } else {
    console.error('❌ Error:', data.message);
    // Show error to user
    alert(data.message);
  }
})
.catch(error => {
  console.error('❌ Network Error:', error);
  alert('Network error. Please check your connection.');
});
