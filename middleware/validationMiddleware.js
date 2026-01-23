import { body, param, query, validationResult } from 'express-validator';

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// Tower validation
export const validateTower = [
  body('name').trim().notEmpty().withMessage('Tower name is required'),
  body('totalFloors').isInt({ min: 1 }).withMessage('Total floors must be at least 1'),
  body('flatsPerFloor').isInt({ min: 1 }).withMessage('Flats per floor must be at least 1'),
  handleValidationErrors
];

// Flat validation
export const validateFlat = [
  body('flatNo').trim().notEmpty().withMessage('Flat number is required'),
  body('tower').isMongoId().withMessage('Valid tower ID is required'),
  body('floor').isInt({ min: 0 }).withMessage('Valid floor number is required'),
  body('flatType').isIn(['1BHK', '2BHK', '3BHK', '4BHK', '5BHK', 'Penthouse', 'Studio']).withMessage('Valid flat type is required'),
  handleValidationErrors
];

// Resident validation
export const validateResident = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('flat').isMongoId().withMessage('Valid flat ID is required'),
  handleValidationErrors
];

// Announcement validation
export const validateAnnouncement = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('category').optional().isIn(['General', 'Emergency', 'Maintenance', 'Event', 'Important', 'Notice']),
  handleValidationErrors
];

// Poll validation
export const validatePoll = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('questions').isArray({ min: 1 }).withMessage('At least one question is required'),
  handleValidationErrors
];

// Helpdesk validation
export const validateHelpdesk = [
  body('category').isIn(['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Cleaning', 'Security', 'Other']).withMessage('Valid category is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  handleValidationErrors
];

// Visitor validation
export const validateVisitor = [
  body('visitorName').trim().notEmpty().withMessage('Visitor name is required'),
  body('visitorPhone').trim().notEmpty().withMessage('Visitor phone is required'),
  body('visitorType').isIn(['Guest', 'Delivery', 'Service Provider', 'Cab', 'Other']).withMessage('Valid visitor type is required'),
  body('flat').isMongoId().withMessage('Valid flat ID is required'),
  handleValidationErrors
];
