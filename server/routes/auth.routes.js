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
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('role').optional().isIn(['admin', 'staff', 'crowd', 'observer', 'user']).withMessage('Invalid role'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').optional().notEmpty().withMessage('Password is required'),
    body('eventId').optional().isString().trim(),
    body('accessCode').optional().isString().trim(),
    validate
  ],
  async (req, res) => {
    try {
      const {
        role = 'user',
        email,
        password,
        eventId,
        accessCode
      } = req.body;

      // Event-specific passcode flow for crowd and observer roles.
      if (role === 'crowd' || role === 'observer') {
        if (!eventId || !accessCode) {
          return res.status(400).json({ message: 'eventId and accessCode are required for crowd/observer login' });
        }
        const event = await Event.findOne({
          eventId: String(eventId).toUpperCase()
        });
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const expectedPasscode = role === 'crowd' ? event.passcodes?.crowd : event.passcodes?.observer;
        if (!expectedPasscode || expectedPasscode !== accessCode) {
          return res.status(401).json({ message: 'Invalid event passcode' });
        }

        const pseudoEmail = `${role}.${event.eventId}@crowd.local`;
        let user = await User.findOne({ email: pseudoEmail });
        if (!user) {
          user = await User.create({
            name: `${role.toUpperCase()} ${event.eventId}`,
            email: pseudoEmail,
            password: `${role}-${event.eventId}-access`,
            role
          });
        }

        user.lastLogin = new Date();
        await user.save();
        return res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          eventId: event.eventId,
          token: generateToken(user._id)
        });
      }

      // Global passcode flow for admin and staff.
      if ((role === 'admin' || role === 'staff') && accessCode) {
        const requiredPasscode = role === 'admin'
          ? process.env.ADMIN_GLOBAL_PASSCODE
          : process.env.STAFF_GLOBAL_PASSCODE;
        if (!requiredPasscode || requiredPasscode !== accessCode) {
          return res.status(401).json({ message: 'Invalid global passcode' });
        }

        const seededEmail = role === 'admin'
          ? (process.env.ADMIN_EMAIL || 'admin@crowdintelligence.com')
          : (process.env.STAFF_EMAIL || 'staff@crowdintelligence.com');
        let user = await User.findOne({ email: seededEmail });
        if (!user) {
          user = await User.create({
            name: role === 'admin' ? 'Admin User' : 'Staff User',
            email: seededEmail,
            password: role === 'admin'
              ? (process.env.ADMIN_PASSWORD || 'admin12345')
              : (process.env.STAFF_PASSWORD || 'staff12345'),
            role
          });
        }

        user.role = role;
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

      // Fallback credential flow.
      if (!email || !password) {
        return res.status(400).json({ message: 'email and password are required' });
      }

      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      user.lastLogin = new Date();
      await user.save();
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
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
