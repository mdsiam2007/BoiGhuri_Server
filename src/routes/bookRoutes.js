const express = require('express');
const router = express.Router();
const {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} = require('../controllers/bookController');
const verifyToken = require('../middlewares/verifyToken');

// Public routes
router.get('/', getAllBooks);
router.get('/:id', getBookById);

// Protected routes (JWT required)
router.post('/', verifyToken, createBook);
router.patch('/:id', verifyToken, updateBook);
router.delete('/:id', verifyToken, deleteBook);

module.exports = router;
