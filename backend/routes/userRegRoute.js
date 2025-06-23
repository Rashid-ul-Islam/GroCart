// routes/userRoutes.js

import express from 'express';
import {
  registerUser,
  loginUser,
  checkUsernameAvailability,
  checkEmailAvailability,
  getUserAddresses,
  addUserAddress
} from '../controllers/userRegController.js';

const router = express.Router();

// Authentication routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Validation routes
router.get('/check-username/:username', checkUsernameAvailability);
router.get('/check-email/:email', checkEmailAvailability);

// Address routes
router.get('/addresses/:userId', getUserAddresses);
router.post('/addresses', addUserAddress);

export default router;
