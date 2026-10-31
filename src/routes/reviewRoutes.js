const express = require('express');
const router = express.Router();
const {
  getBookReviews,
  addReview,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');
const verifyToken = require('../middlewares/verifyToken');

// Public route to view reviews
router.get('/', getBookReviews);
router.get('/:bookId', getBookReviews);

// Protected routes (JWT required)
router.post('/', verifyToken, addReview);
router.patch('/:id', verifyToken, updateReview);
router.delete('/:id', verifyToken, deleteReview);

module.exports = router;
