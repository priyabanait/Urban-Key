// Family Members API Usage Examples
// Import axios or use fetch API

const API_BASE_URL = 'http://localhost:5000/api';

// Assume you have authentication token
const authToken = 'your-jwt-token-here';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${authToken}`
};

// ============================================
// RESIDENT USAGE EXAMPLES
// ============================================

/**
 * Example 1: Add a single family member
 */
async function addSingleFamilyMember() {
  try {
    const response = await fetch(`${API_BASE_URL}/family-members`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Sarah Johnson',
        relation: 'Spouse',
        age: 32,
        gender: 'Female',
        phone: '9876543210',
        email: 'sarah@example.com',
        photo: 'https://example.com/sarah.jpg',
        flatId: '507f1f77bcf86cd799439011'
      })
    });

    const data = await response.json();
    console.log('Family member added:', data);
    // Response: { success: true, message: '...', data: { ... } }
  } catch (error) {
    console.error('Error adding family member:', error);
  }
}

/**
 * Example 2: Add multiple family members at once
 */
async function addMultipleFamilyMembers() {
  try {
    const response = await fetch(`${API_BASE_URL}/family-members/bulk`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        flatId: '507f1f77bcf86cd799439011',
        familyMembers: [
          {
            name: 'Sarah Johnson',
            relation: 'Spouse',
            age: 32,
            gender: 'Female',
            phone: '9876543210',
            email: 'sarah@example.com'
          },
          {
            name: 'Tommy Johnson',
            relation: 'Child',
            age: 8,
            gender: 'Male',
            phone: '9876543211'
          },
          {
            name: 'Emily Johnson',
            relation: 'Child',
            age: 5,
            gender: 'Female'
          },
          {
            name: 'Robert Johnson Sr.',
            relation: 'Parent',
            age: 65,
            gender: 'Male',
            phone: '9876543212',
            email: 'robert.sr@example.com'
          }
        ]
      })
    });

    const data = await response.json();
    console.log('Family members added:', data);
    // Response: { success: true, message: '4 family members added...', data: [...], count: 4 }
  } catch (error) {
    console.error('Error adding family members:', error);
  }
}

/**
 * Example 3: Get all my family members
 */
async function getMyFamilyMembers() {
  try {
    const response = await fetch(`${API_BASE_URL}/family-members/my-family`, {
      method: 'GET',
      headers
    });

    const data = await response.json();
    console.log('My family members:', data);
    
    // Display the family members
    if (data.success) {
      console.log(`Total family members: ${data.count}`);
      data.data.forEach(member => {
        console.log(`- ${member.name} (${member.relation}), Age: ${member.age}, Approved: ${member.isApproved}`);
      });
    }
  } catch (error) {
    console.error('Error fetching family members:', error);
  }
}

/**
 * Example 4: Update a family member
 */
async function updateFamilyMember(memberId) {
  try {
    const response = await fetch(`${API_BASE_URL}/family-members/${memberId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        age: 33, // Updated age
        phone: '9876543299', // Updated phone
        email: 'sarah.new@example.com' // Updated email
      })
    });

    const data = await response.json();
    console.log('Family member updated:', data);
  } catch (error) {
    console.error('Error updating family member:', error);
  }
}

/**
 * Example 5: Delete a family member
 */
async function deleteFamilyMember(memberId) {
  try {
    const response = await fetch(`${API_BASE_URL}/family-members/${memberId}`, {
      method: 'DELETE',
      headers
    });

    const data = await response.json();
    console.log('Family member deleted:', data);
  } catch (error) {
    console.error('Error deleting family member:', error);
  }
}

/**
 * Example 6: Get a specific family member
 */
async function getFamilyMemberById(memberId) {
  try {
    const response = await fetch(`${API_BASE_URL}/family-members/${memberId}`, {
      method: 'GET',
      headers
    });

    const data = await response.json();
    console.log('Family member details:', data);
  } catch (error) {
    console.error('Error fetching family member:', error);
  }
}

// ============================================
// ADMIN USAGE EXAMPLES
// ============================================

/**
 * Example 7: Get all family members (Admin)
 */
async function getAllFamilyMembers() {
  try {
    const response = await fetch(`${API_BASE_URL}/family-members`, {
      method: 'GET',
      headers
    });

    const data = await response.json();
    console.log('All family members:', data);
  } catch (error) {
    console.error('Error fetching all family members:', error);
  }
}

/**
 * Example 8: Get pending family members (Admin)
 */
async function getPendingFamilyMembers() {
  try {
    const response = await fetch(`${API_BASE_URL}/family-members?status=pending`, {
      method: 'GET',
      headers
    });

    const data = await response.json();
    console.log('Pending family members:', data);
    
    if (data.success) {
      console.log(`Total pending: ${data.count}`);
      data.data.forEach(member => {
        console.log(`- ${member.name} added by ${member.resident.fullName} for flat ${member.flat.flatNo}`);
      });
    }
  } catch (error) {
    console.error('Error fetching pending family members:', error);
  }
}

/**
 * Example 9: Get approved family members for a specific flat (Admin)
 */
async function getFamilyMembersByFlat(flatId) {
  try {
    const response = await fetch(`${API_BASE_URL}/family-members?flatId=${flatId}&status=approved`, {
      method: 'GET',
      headers
    });

    const data = await response.json();
    console.log('Family members for flat:', data);
  } catch (error) {
    console.error('Error fetching family members by flat:', error);
  }
}

/**
 * Example 10: Approve a family member (Admin)
 */
async function approveFamilyMember(memberId) {
  try {
    const response = await fetch(`${API_BASE_URL}/family-members/${memberId}/approve`, {
      method: 'PUT',
      headers
    });

    const data = await response.json();
    console.log('Family member approved:', data);
  } catch (error) {
    console.error('Error approving family member:', error);
  }
}

/**
 * Example 11: Reject a family member (Admin)
 */
async function rejectFamilyMember(memberId) {
  try {
    const response = await fetch(`${API_BASE_URL}/family-members/${memberId}/reject`, {
      method: 'PUT',
      headers
    });

    const data = await response.json();
    console.log('Family member rejected:', data);
  } catch (error) {
    console.error('Error rejecting family member:', error);
  }
}

/**
 * Example 12: Get all pending approvals (includes family members, vehicles, maids)
 */
async function getAllPendingApprovals() {
  try {
    const response = await fetch(`${API_BASE_URL}/approvals/pending`, {
      method: 'GET',
      headers
    });

    const data = await response.json();
    console.log('All pending approvals:', data);
    
    if (data.success) {
      console.log(`Family members pending: ${data.data.familyMembers.length}`);
      console.log(`Vehicles pending: ${data.data.vehicles.length}`);
      console.log(`Maids pending: ${data.data.maids.length}`);
      console.log(`Total pending: ${data.data.total}`);
    }
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
  }
}

/**
 * Example 13: Get family member count for a resident (Admin)
 */
async function getFamilyMemberCount(residentId) {
  try {
    const response = await fetch(`${API_BASE_URL}/family-members/count/${residentId}`, {
      method: 'GET',
      headers
    });

    const data = await response.json();
    console.log('Family member count:', data);
    // Response: { success: true, data: { count: 3 } }
  } catch (error) {
    console.error('Error fetching family member count:', error);
  }
}

// ============================================
// COMBINED WORKFLOW EXAMPLE
// ============================================

/**
 * Example 14: Complete workflow - Resident adds family during/after registration
 */
async function completeRegistrationWithFamily() {
  try {
    // Step 1: Complete resident registration
    const residentId = '507f1f77bcf86cd799439010';
    const registrationResponse = await fetch(`${API_BASE_URL}/members/complete-registration/${residentId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fullName: 'John Doe',
        gender: 'Male',
        dateOfBirth: '1990-01-15',
        mobile: '9876543210',
        email: 'john@example.com',
        societyName: 'Green Valley',
        flatNumber: 'A-101',
        ownershipType: 'Owner',
        // ... other fields
      })
    });

    const registrationData = await registrationResponse.json();
    console.log('Registration completed:', registrationData);

    // Step 2: Add family members after registration
    if (registrationData.member) {
      const flatId = registrationData.member.flat; // Assume flat ID is available
      
      const familyResponse = await fetch(`${API_BASE_URL}/family-members/bulk`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          flatId: flatId,
          familyMembers: [
            {
              name: 'Jane Doe',
              relation: 'Spouse',
              age: 32,
              gender: 'Female',
              phone: '9876543211',
              email: 'jane@example.com'
            },
            {
              name: 'Jimmy Doe',
              relation: 'Child',
              age: 8,
              gender: 'Male'
            }
          ]
        })
      });

      const familyData = await familyResponse.json();
      console.log('Family members added:', familyData);
    }

    // Step 3: Check status of family members
    const myFamilyResponse = await fetch(`${API_BASE_URL}/family-members/my-family`, {
      method: 'GET',
      headers
    });

    const myFamilyData = await myFamilyResponse.json();
    console.log('My family status:', myFamilyData);

  } catch (error) {
    console.error('Error in registration workflow:', error);
  }
}

// ============================================
// USING AXIOS (Alternative)
// ============================================

/**
 * Example 15: Using Axios for cleaner syntax
 */
import axios from 'axios';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  }
});

async function axiosExamples() {
  try {
    // Add single family member
    const addResponse = await api.post('/family-members', {
      name: 'Sarah Johnson',
      relation: 'Spouse',
      age: 32,
      gender: 'Female',
      flatId: '507f1f77bcf86cd799439011'
    });
    console.log(addResponse.data);

    // Get my family
    const familyResponse = await api.get('/family-members/my-family');
    console.log(familyResponse.data);

    // Approve (Admin)
    const approveResponse = await api.put('/family-members/507f1f77bcf86cd799439012/approve');
    console.log(approveResponse.data);

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// ============================================
// ERROR HANDLING EXAMPLE
// ============================================

/**
 * Example 16: Proper error handling
 */
async function addFamilyMemberWithErrorHandling() {
  try {
    const response = await fetch(`${API_BASE_URL}/family-members`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Sarah Johnson',
        relation: 'Spouse',
        age: 32,
        flatId: '507f1f77bcf86cd799439011'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle HTTP errors
      if (response.status === 400) {
        console.error('Validation error:', data.message);
      } else if (response.status === 404) {
        console.error('Resource not found:', data.message);
      } else if (response.status === 401) {
        console.error('Authentication failed');
      } else {
        console.error('Server error:', data.message);
      }
      return;
    }

    // Success
    console.log('Success:', data);
    return data;

  } catch (error) {
    // Handle network errors
    console.error('Network error:', error);
  }
}

// Export functions for use in your application
export {
  addSingleFamilyMember,
  addMultipleFamilyMembers,
  getMyFamilyMembers,
  updateFamilyMember,
  deleteFamilyMember,
  getFamilyMemberById,
  getAllFamilyMembers,
  getPendingFamilyMembers,
  getFamilyMembersByFlat,
  approveFamilyMember,
  rejectFamilyMember,
  getAllPendingApprovals,
  getFamilyMemberCount,
  completeRegistrationWithFamily,
  axiosExamples,
  addFamilyMemberWithErrorHandling
};
