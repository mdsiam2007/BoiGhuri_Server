const express = require('express');
const router = express.Router();
const {
  borrowBook,
  getMyBorrows,
  returnBook,
} = require('../controllers/borrowController');
const verifyToken = require('../middlewares/verifyToken');

// All borrow routes are protected with JWT
router.use(verifyToken);

router.post('/', borrowBook);
router.get('/', getMyBorrows);
router.delete('/:id', returnBook);

module.exports = router;
