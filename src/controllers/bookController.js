const mongoose = require('mongoose');
const Book = require('../models/Book');

// @desc    Get all books (with optional sort, limit, category, search, userEmail filters)
// @route   GET /books
// @access  Public
const getAllBooks = async (req, res) => {
  try {
    const { limit, sort, category, search, userEmail } = req.query;

    const query = {};

    // Filter by category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Filter by adding user's email (useful for /my-books)
    if (userEmail) {
      query.userEmail = userEmail.toLowerCase();
    }

    // Search by title or author regex
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
      ];
    }

    // Sort: default to newest first
    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (sort === 'title_asc') {
      sortOption = { title: 1 };
    } else if (sort === 'title_desc') {
      sortOption = { title: -1 };
    } else if (sort === 'copies') {
      sortOption = { totalCopies: -1 };
    }

    let booksQuery = Book.find(query).sort(sortOption);

    // Limit if specified
    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        booksQuery = booksQuery.limit(parsedLimit);
      }
    }

    const books = await booksQuery.exec();

    res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'বই লোড করতে সমস্যা হয়েছে: ' + error.message,
    });
  }
};

// @desc    Get single book by ID
// @route   GET /books/:id
// @access  Public
const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'অকার্যকর বুক আইডি!',
      });
    }

    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'বইটি খুঁজে পাওয়া যায়নি!',
      });
    }

    res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'বইয়ের বিবরণ আনতে ত্রুটি: ' + error.message,
    });
  }
};

module.exports = {
  getAllBooks,
  getBookById,
};
