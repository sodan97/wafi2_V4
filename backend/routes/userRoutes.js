
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// POST /api/users/register
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName } = req.body;
    const db = req.db; // Access Firestore instance from middleware

    try {
      // Check if user already exists
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', email).get();

      if (!snapshot.empty) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user object with a 'role' field
      const newUser = {
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role: 'client', // Default role is 'client'
        createdAt: new Date().toISOString(),
      };

      // Add the new user to the 'users' collection in Firestore
      const docRef = await db.collection('users').add(newUser);

      // Respond with the created user (excluding password)
      const userResponse = { ...newUser, id: docRef.id };
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
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const db = req.db;

    try {
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', email).get();

      if (snapshot.empty) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      const isMatch = await bcrypt.compare(password, userData.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Create JWT payload with the user's role
      const payload = {
        id: userDoc.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || 'client', // Use role from DB, default to 'client'
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
      
      // Prepare user response (excluding password)
      const userResponse = { ...userData, id: userDoc.id };
      delete userResponse.password;

      res.json({ token, user: userResponse });

    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;
