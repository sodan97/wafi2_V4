import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import emailService from '../services/emailService.js';

const router = express.Router();

// POST /api/users/register
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Invalid email format').notEmpty().withMessage('Email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
  ],
  async (req, res) => {
    console.log('POST /api/users/register route hit');
    console.log('Registration request body (excluding password):', { 
      email: req.body.email, 
      firstName: req.body.firstName, 
      lastName: req.body.lastName 
    });

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Check if user already exists
      console.log('Checking for existing user with email:', email);
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.log('Existing user found:', existingUser.email);
        return res.status(400).json({ message: 'User with this email already exists' });
      }
      console.log('No existing user found. Proceeding with registration.');

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newUser = new User({
        email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        password: hashedPassword,
      });

      // Save user to database
      console.log('Saving new user to database...');
      await newUser.save();
      console.log('New user saved successfully.');

      // Send welcome email (non-blocking)
      try {
        console.log('Sending welcome email to:', email);
        await emailService.sendWelcomeEmail(email, req.body.firstName, req.body.lastName);
        console.log('✅ Welcome email sent successfully');
      } catch (emailError) {
        console.error('❌ Error sending welcome email (non-blocking):', emailError);
        // Don't fail the registration if email fails
      }

      // Return the created user (excluding password)
      const userResponse = newUser.toObject();
      delete userResponse.password;

      res.status(201).json(userResponse);

    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// POST /api/users/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Invalid email format').notEmpty().withMessage('Email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    console.log('POST /api/users/login route hit');
    console.log('Login request body (excluding password):', { email: req.body.email });

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Find user by email
      console.log('Finding user with email:', email);
      const user = await User.findOne({ email });
      if (!user) {
        console.log('User not found with email:', email);
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      console.log('User found:', user.email);

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log('Password does not match for user:', email);
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      console.log('Password matches for user:', email);

      // Create JWT payload
      const payload = {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      };

      // Sign JWT
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
      console.log('JWT token created for user:', email);

      // Return user and token (excluding password)
      const userResponse = user.toObject();
      delete userResponse.password;

      res.json({
        token,
        user: userResponse,
      });

    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/users (for admin to get all users)
router.get('/', async (req, res) => {
  console.log('GET /api/users route hit');
  try {
    const users = await User.find().select('-password'); // Exclude passwords
    console.log(`Found ${users.length} users`);
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  console.log('GET /api/users/:id route hit with id:', req.params.id);
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      console.log('User not found with id:', req.params.id);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('User found:', user.email);
    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;