import express from 'express';
import {
  getBookReviews,
  addReview,
  updateReview,
  deleteReview,
} from '../controllers/reviewController.js';
import verifyToken from '../middlewares/verifyToken.js';

const router = express.Router();

// Public route to view reviews
router.get('/', getBookReviews);
router.get('/:bookId', getBookReviews);

// Protected routes (JWT required)
router.post('/', verifyToken, addReview);
router.patch('/:id', verifyToken, updateReview);
router.delete('/:id', verifyToken, deleteReview);

export default router;
