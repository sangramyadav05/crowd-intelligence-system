import express from 'express';
import { body, validationResult } from 'express-validator';
import { Event, User } from '../models/index.js';
import { generateToken } from '../utils/generateToken.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    validate
  ],
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      // Check if user exists
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create user
      const user = await User.create({
        name,
        email,
        password,
        role: 'user'
      });

      if (user) {
        res.status(201).json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id)
        });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user (Crowd Manager with email/password or Coordinator with ID)
// @access  Public
router.post(
  '/login',
  [
    body('role').optional().isIn(['user', 'staff']).withMessage('Invalid role'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').optional().notEmpty().withMessage('Password is required'),
    body('coordinatorId').optional().isString().trim().toUpperCase(),
    body('eventId').optional().isString().trim(),
    validate
  ],
  async (req, res) => {
    try {
      const {
        role = 'user',
        email,
        password,
        coordinatorId,
        eventId
      } = req.body;

      // Crowd Manager login with email and password
      if (role === 'user') {
        if (!email || !password) {
          return res.status(400).json({ message: 'Email and password are required for Crowd Manager login' });
        }

        const user = await User.findOne({ email, role: 'user' });
        if (!user || !(await user.comparePassword(password))) {
          return res.status(401).json({ message: 'Invalid email or password' });
        }

        user.lastLogin = new Date();
        await user.save();
        return res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id)
        });
      }

      // Coordinator login with Coordinator ID
      if (role === 'staff') {
        if (!coordinatorId || !eventId) {
          return res.status(400).json({ message: 'Coordinator ID and Event ID are required for Coordinator login' });
        }

        // Find event and verify coordinator is assigned
        const event = await Event.findOne({
          _id: eventId,
          'coordinators.coordinatorId': coordinatorId
        });

        if (!event) {
          return res.status(401).json({ message: 'Invalid Coordinator ID or Event ID' });
        }

        // Find coordinator in event
        const coordinatorInfo = event.coordinators.find(c => c.coordinatorId === coordinatorId);
        
        if (coordinatorInfo.status !== 'active') {
          return res.status(401).json({ message: 'Coordinator account is inactive' });
        }

        // Find or create coordinator user if needed
        let user;
        if (coordinatorInfo.userId) {
          user = await User.findById(coordinatorInfo.userId);
          if (!user) {
            return res.status(401).json({ message: 'Coordinator user not found' });
          }
        } else {
          // Try to find user by coordinatorId
          user = await User.findOne({ coordinatorId, role: 'staff' });
          if (!user) {
            return res.status(401).json({ message: 'Coordinator account not found' });
          }
        }

        user.lastLogin = new Date();
        await user.save();
        return res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          coordinatorId: user.coordinatorId,
          token: generateToken(user._id)
        });
      }

      return res.status(400).json({ message: 'Invalid role' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// @route   POST /api/auth/admin-login
// @desc    Admin login
// @access  Public
router.post(
  '/admin-login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate
  ],
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email, role: 'admin' });

      if (!user) {
        return res.status(401).json({ message: 'Invalid admin credentials' });
      }

      if (await user.comparePassword(password)) {
        user.lastLogin = new Date();
        await user.save();

        res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id)
        });
      } else {
        res.status(401).json({ message: 'Invalid admin credentials' });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/auth/validate
// @desc    Validate token/session and return current user
// @access  Private
router.get('/validate', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(401).json({ valid: false, message: 'User not found' });
    }

    res.json({
      valid: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ valid: false, message: error.message });
  }
});

export default router;
