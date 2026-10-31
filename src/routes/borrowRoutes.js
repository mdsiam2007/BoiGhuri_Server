import express from 'express';
import {
  borrowBook,
  getMyBorrows,
  returnBook,
} from '../controllers/borrowController.js';
import verifyToken from '../middlewares/verifyToken.js';

const router = express.Router();

// All borrow routes are protected with JWT
router.use(verifyToken);

router.post('/', borrowBook);
router.get('/', getMyBorrows);
router.delete('/:id', returnBook);

export default router;
