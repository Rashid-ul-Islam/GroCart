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

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/check-username/:username', checkUsernameAvailability);
router.get('/check-email/:email', checkEmailAvailability);

router.get('/addresses/:userId', getUserAddresses);
router.post('/addresses', addUserAddress);

export default router;
