import express from 'express';
import {
  createJwtToken,
  clearJwtToken,
  updateProfileName,
} from '../controllers/authController.js';
import verifyToken from '../middlewares/verifyToken.js';

const router = express.Router();

router.post('/jwt', createJwtToken);
router.post('/logout', clearJwtToken);
router.patch('/profile', verifyToken, updateProfileName);

export default router;
