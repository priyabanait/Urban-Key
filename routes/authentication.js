import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Resident from '../models/Resident.js';
import FamilyMember from '../models/FamilyMember.js';
import Notification from '../models/Notification.js';

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Unified Signup & Registration API
 * Handles both user creation and complete profile registration in one call
 */
router.post('/signup', async (req, res) => {
	try {
		const { mobile, otp, username, residentData } = req.body;

		if (!mobile || !otp) {
			return res.status(400).json({ message: 'Mobile and OTP are required.' });
		}

		// Check if mobile number already exists
		const existingUser = await User.findOne({ mobile });
		if (existingUser) {
			return res.status(400).json({ message: 'Mobile number already registered.' });
		}

		// Check if resident profile exists
		const existingResident = await Resident.findOne({ mobile });
		if (existingResident) {
			return res.status(400).json({ message: 'Resident profile already exists with this mobile number.' });
		}

		// Create new user with OTP
		const user = new User({
			username: username || undefined,
			mobile,
			password: otp,
			registrationCompleted: residentData ? true : false,
			status: residentData ? 'pending' : 'active'
		});

		await user.save();

		// If resident data is provided, create resident profile
		let resident = null;
		if (residentData) {
			resident = await Resident.create({
				...residentData,
				mobile,
				isNewMember: false,
				registrationCompleted: true,
				approvedByAdmin: false
			});

			// Link user to resident
			user.flat = resident._id;
			user.role = 'resident';
			await user.save();
		}

		// Save notification
		try {
			await Notification.create({
				type: 'new_user',
				title: resident ? 'New Resident Registration' : 'New User Signup',
				message: resident 
					? `${residentData.fullName} completed registration (${mobile})`
					: `${username || mobile} signed up (OTP).`,
				payload: { userId: user._id, user, resident },
				read: false
			});
		} catch (err) {
			console.error('Notification save failed:', err);
		}

		// Emit dashboard notification
		try {
			const io = req.app?.locals?.io;
			if (io) {
				io.to('dashboard').emit('dashboard_notification', {
					type: resident ? 'new_resident' : 'new_user',
					title: resident ? 'New Resident Registration' : 'New User Signup',
					message: resident 
						? `${residentData.fullName} completed registration`
						: `${username || mobile} signed up.`,
					userId: user._id,
					user,
					resident
				});
			}
		} catch (emitErr) {
			console.error('Socket emit failed:', emitErr);
		}

		// Generate JWT token
		const token = jwt.sign(
			{
				id: user._id,
				username: user.username,
				mobile: user.mobile,
				type: user.role || 'user'
			},
			SECRET,
			{ expiresIn: '30d' }
		);

		return res.status(201).json({
			success: true,
			message: resident ? 'Registration completed successfully. Awaiting admin approval.' : 'Signup successful.',
			token,
			user: {
				id: user._id,
				username: user.username,
				mobile: user.mobile,
				registrationCompleted: user.registrationCompleted,
				status: user.status,
				role: user.role
			},
			resident: resident ? {
				id: resident._id,
				fullName: resident.fullName,
				societyName: resident.societyName,
				flatNumber: resident.flatNumber,
				approvedByAdmin: resident.approvedByAdmin
			} : null
		});
	} catch (error) {
		console.error('Unified signup/registration error:', error);
		return res.status(500).json({ 
			success: false,
			message: 'Server error during signup/registration.',
			error: error.message 
		});
	}
});

/**
 * Complete Registration (After Basic Signup)
 * User first signs up with OTP, then completes registration with same mobile
 */
router.post('/complete-registration', async (req, res) => {
	try {
		const { mobile, residentData } = req.body;

		if (!mobile) {
			return res.status(400).json({ 
				success: false,
				message: 'Mobile number is required.' 
			});
		}

		if (!residentData) {
			return res.status(400).json({ 
				success: false,
				message: 'Resident data is required for registration.' 
			});
		}

		// Find existing user by mobile
		const user = await User.findOne({ mobile });
		if (!user) {
			return res.status(404).json({ 
				success: false,
				message: 'User not found. Please sign up first.' 
			});
		}

		// Check if user already completed registration
		if (user.registrationCompleted) {
			return res.status(400).json({ 
				success: false,
				message: 'Registration already completed for this mobile number.' 
			});
		}

		// Check if resident profile already exists
		const existingResident = await Resident.findOne({ mobile });
		if (existingResident) {
			return res.status(400).json({ 
				success: false,
				message: 'Resident profile already exists with this mobile number.' 
			});
		}

		// Create resident profile
		const resident = await Resident.create({
			...residentData,
			mobile,
			isNewMember: false,
			registrationCompleted: true,
			approvedByAdmin: false
		});

		// Update user record
		user.registrationCompleted = true;
		user.status = 'pending';
		user.role = 'resident';
		user.flat = resident._id;
		await user.save();

		// Save notification
		try {
			await Notification.create({
				type: 'new_resident',
				title: 'New Resident Registration',
				message: `${residentData.fullName} completed registration (${mobile})`,
				payload: { userId: user._id, user, resident },
				read: false
			});
		} catch (err) {
			console.error('Notification save failed:', err);
		}

		// Emit dashboard notification
		try {
			const io = req.app?.locals?.io;
			if (io) {
				io.to('dashboard').emit('dashboard_notification', {
					type: 'new_resident',
					title: 'New Resident Registration',
					message: `${residentData.fullName} completed registration`,
					userId: user._id,
					user,
					resident
				});
			}
		} catch (emitErr) {
			console.error('Socket emit failed:', emitErr);
		}

		// Generate new JWT token with updated user info
		const token = jwt.sign(
			{
				id: user._id,
				username: user.username,
				mobile: user.mobile,
				type: user.role
			},
			SECRET,
			{ expiresIn: '30d' }
		);

		return res.status(200).json({
			success: true,
			message: 'Registration completed successfully. Awaiting admin approval.',
			token,
			user: {
				id: user._id,
				username: user.username,
				mobile: user.mobile,
				registrationCompleted: user.registrationCompleted,
				status: user.status,
				role: user.role
			},
			resident: {
				id: resident._id,
				fullName: resident.fullName,
				societyName: resident.societyName,
				flatNumber: resident.flatNumber,
				approvedByAdmin: resident.approvedByAdmin
			}
		});
	} catch (error) {
		console.error('Complete registration error:', error);
		return res.status(500).json({ 
			success: false,
			message: 'Server error during registration.',
			error: error.message 
		});
	}
});

/**
 * Backward Compatibility: Old signup-otp endpoint
 * Redirects to the new unified signup endpoint
 */
router.post('/signup-otp', async (req, res) => {
	// Simply call the unified signup without resident data
	req.body.residentData = null;
	return router.handle({ ...req, url: '/signup', method: 'POST' }, res);
});

/**
 * User Login with OTP
 * Returns user and resident data if available
 */
router.post('/login-otp', async (req, res) => {
	try {
		const { mobile, otp } = req.body;

		if (!mobile || !otp) {
			return res.status(400).json({ 
				success: false,
				message: 'Mobile and OTP are required.' 
			});
		}

		const user = await User.findOne({ mobile });
		if (!user || user.password !== otp) {
			return res.status(401).json({ 
				success: false,
				message: 'Invalid mobile number or OTP.' 
			});
		}

		// Fetch resident data if user is a resident
		let resident = null;
		if (user.role === 'resident' || user.registrationCompleted) {
			resident = await Resident.findOne({ mobile });
		}

		const token = jwt.sign(
			{
				id: user._id,
				username: user.username,
				mobile: user.mobile,
				type: user.role || 'user'
			},
			SECRET,
			{ expiresIn: '30d' }
		);

		return res.json({
			success: true,
			message: 'Login successful.',
			token,
			user: {
				id: user._id,
				username: user.username,
				mobile: user.mobile,
				registrationCompleted: user.registrationCompleted || false,
				status: user.status,
				role: user.role
			},
			resident: resident ? {
				id: resident._id,
				fullName: resident.fullName,
				societyName: resident.societyName,
				flatNumber: resident.flatNumber,
				approvedByAdmin: resident.approvedByAdmin,
				ownershipType: resident.ownershipType
			} : null
		});
	} catch (error) {
		console.error('User login OTP error:', error);
		return res.status(500).json({ 
			success: false,
			message: 'Server error during login.',
			error: error.message 
		});
	}
});
/**
 * Forgot Password / Reset Password
 */
router.post('/forgot-password', async (req, res) => {
	try {
		const { mobile, newPassword } = req.body;

		if (!mobile || !newPassword) {
			return res.status(400).json({ 
				success: false,
				message: 'Mobile number and new password are required.' 
			});
		}

		const user = await User.findOne({ mobile });
		if (!user) {
			return res.status(404).json({ 
				success: false,
				message: 'User not found with this mobile number.' 
			});
		}

		user.password = newPassword;
		await user.save();

		return res.json({
			success: true,
			message: 'Password updated successfully.',
			user: {
				id: user._id,
				username: user.username,
				mobile: user.mobile
			}
		});
	} catch (error) {
		console.error('Forgot password error:', error);
		return res.status(500).json({ 
			success: false,
			message: 'Server error during password reset.',
			error: error.message 
		});
	}
});

/**
 * Family Member Login with Email/Password
 * POST /api/auth/family-member/login
 */
router.post('/family-member/login', async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({ 
				success: false,
				message: 'Email and password are required.' 
			});
		}

		// Find family member by email and include password field
		const familyMember = await FamilyMember.findOne({ email })
			.select('+password')
			.populate('resident', 'fullName mobile')
			.populate('flat', 'flatNo tower');

		if (!familyMember) {
			return res.status(401).json({ 
				success: false,
				message: 'Invalid email or password.' 
			});
		}

		// Check if family member is approved
		if (!familyMember.isApproved) {
			return res.status(403).json({ 
				success: false,
				message: 'Your account is pending approval. Please contact the resident or admin.' 
			});
		}

		// Check if family member can login
		if (!familyMember.canLogin || !familyMember.password) {
			return res.status(403).json({ 
				success: false,
				message: 'Login is not enabled for your account. Please contact the resident.' 
			});
		}

		// Verify password
		const isPasswordMatch = await familyMember.comparePassword(password);
		
		if (!isPasswordMatch) {
			return res.status(401).json({ 
				success: false,
				message: 'Invalid email or password.' 
			});
		}

		// Update last login
		familyMember.lastLogin = new Date();
		await familyMember.save();

		// Generate JWT token
		const token = jwt.sign(
			{
				id: familyMember._id,
				email: familyMember.email,
				name: familyMember.name,
				type: 'family_member',
				residentId: familyMember.resident?._id,
				flatId: familyMember.flat?._id
			},
			SECRET,
			{ expiresIn: '30d' }
		);

		return res.json({
			success: true,
			message: 'Login successful.',
			token,
			user: {
				id: familyMember._id,
				name: familyMember.name,
				email: familyMember.email,
				relation: familyMember.relation,
				phone: familyMember.phone,
				type: 'family_member',
				isApproved: familyMember.isApproved,
				resident: familyMember.resident,
				flat: familyMember.flat
			}
		});
	} catch (error) {
		console.error('Family member login error:', error);
		return res.status(500).json({ 
			success: false,
			message: 'Server error during login.',
			error: error.message 
		});
	}
});

/**
 * Family Member Signup/Set Credentials
 * POST /api/auth/family-member/set-credentials
 * Used by family members to set their email and password after being added by resident
 */
router.post('/family-member/set-credentials', async (req, res) => {
	try {
		const { familyMemberId, email, password } = req.body;

		if (!familyMemberId || !email || !password) {
			return res.status(400).json({ 
				success: false,
				message: 'Family member ID, email, and password are required.' 
			});
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({ 
				success: false,
				message: 'Please provide a valid email address.' 
			});
		}

		// Validate password strength (at least 6 characters)
		if (password.length < 6) {
			return res.status(400).json({ 
				success: false,
				message: 'Password must be at least 6 characters long.' 
			});
		}

		// Find family member
		const familyMember = await FamilyMember.findById(familyMemberId);

		if (!familyMember) {
			return res.status(404).json({ 
				success: false,
				message: 'Family member not found.' 
			});
		}

		// Check if email already exists
		const existingMember = await FamilyMember.findOne({ 
			email, 
			_id: { $ne: familyMemberId } 
		});

		if (existingMember) {
			return res.status(400).json({ 
				success: false,
				message: 'Email is already registered with another family member.' 
			});
		}

		// Update family member with credentials
		familyMember.email = email.toLowerCase();
		familyMember.password = password;  // Will be hashed by pre-save hook
		familyMember.canLogin = true;
		
		await familyMember.save();

		// Generate JWT token
		const token = jwt.sign(
			{
				id: familyMember._id,
				email: familyMember.email,
				name: familyMember.name,
				type: 'family_member',
				residentId: familyMember.resident,
				flatId: familyMember.flat
			},
			SECRET,
			{ expiresIn: '30d' }
		);

		return res.json({
			success: true,
			message: 'Credentials set successfully. You can now login.',
			token,
			user: {
				id: familyMember._id,
				name: familyMember.name,
				email: familyMember.email,
				relation: familyMember.relation,
				type: 'family_member',
				isApproved: familyMember.isApproved,
				canLogin: familyMember.canLogin
			}
		});
	} catch (error) {
		console.error('Set family member credentials error:', error);
		return res.status(500).json({ 
			success: false,
			message: 'Server error while setting credentials.',
			error: error.message 
		});
	}
});

/**
 * Get All Registered Members (Admin Panel)
 * Returns all users with their resident details if they've completed registration
 */
router.get('/registered-members', async (req, res) => {
	try {
		// Fetch all users who have completed registration
		const users = await User.find({ registrationCompleted: true })
			.populate('flat')
			.populate('society')
			.sort({ createdAt: -1 });

		// Get resident details for each user
		const membersWithDetails = await Promise.all(
			users.map(async (user) => {
				const resident = await Resident.findOne({ mobile: user.mobile });
				
				return {
					userId: user._id,
					username: user.username,
					mobile: user.mobile,
					role: user.role,
					status: user.status,
					registrationCompleted: user.registrationCompleted,
					createdAt: user.createdAt,
					lastLogin: user.lastLogin,
					// Resident details
					resident: resident ? {
						_id: resident._id,
						id: resident._id,
						fullName: resident.fullName,
						gender: resident.gender,
						dateOfBirth: resident.dateOfBirth,
						email: resident.email,
						alternateMobile: resident.alternateMobile,
						governmentIdNumber: resident.governmentIdNumber,
						societyName: resident.societyName,
						buildingName: resident.buildingName,
						flatNumber: resident.flatNumber,
						floorNumber: resident.floorNumber,
						flatType: resident.flatType,
						ownershipType: resident.ownershipType,
						moveInDate: resident.moveInDate,
						numberOfFamilyMembers: resident.numberOfFamilyMembers,
						familyMembers: resident.familyMembers,
						emergencyContactName: resident.emergencyContactName,
						emergencyContactNumber: resident.emergencyContactNumber,
						vehicles: resident.vehicles,
						documents: resident.documents,
						approvedByAdmin: resident.approvedByAdmin,
						approvedBy: resident.approvedBy,
						approvedAt: resident.approvedAt,
						remarks: resident.remarks,
						createdAt: resident.createdAt
					} : null
				};
			})
		);

		return res.json({
			success: true,
			count: membersWithDetails.length,
			members: membersWithDetails
		});
	} catch (error) {
		console.error('Get registered members error:', error);
		return res.status(500).json({ 
			success: false,
			message: 'Server error fetching registered members.',
			error: error.message 
		});
	}
});

export default router;
