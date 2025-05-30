const { body, validationResult } = require('express-validator');

const validateSignup = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/)
    .withMessage('Password must contain at least one letter and one number'),
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['patient', 'doctor']).withMessage('Role must be either patient or doctor'),
  body('age')
    .if(body('role').equals('patient'))
    .notEmpty().withMessage('Age is required for patients')
    .isInt({ min: 1, max: 120 }).withMessage('Age must be between 1 and 120'),
  body('gender')
    .if(body('role').equals('patient'))
    .notEmpty()
    .isIn(['male', 'female', 'other']),
  body('specialization')
    .if(body('role').equals('doctor'))
    .notEmpty().withMessage('Specialization is required for doctors')
    .isIn(['Psychiatrist', 'Counselor', 'Therapist'])
    .withMessage('Please select a valid specialization'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: errors.array().map(err => err.msg).join(', ')
      });
    }
    next();
  }
];

const validateLogin = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address'),
  body('password')
    .notEmpty().withMessage('Password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: errors.array().map(err => err.msg).join(', ')
      });
    }
    next();
  }
];

module.exports = { validateSignup, validateLogin }; 