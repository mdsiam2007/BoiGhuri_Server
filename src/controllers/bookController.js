import mongoose from 'mongoose';
import Book from '../models/Book.js';

// @desc    Get all books (with optional sort, limit, category, search, userEmail filters)
// @route   GET /books
// @access  Public
export const getAllBooks = async (req, res) => {
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
export const getBookById = async (req, res) => {
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

// @desc    Add a new book
// @route   POST /books
// @access  Private (JWT)
export const createBook = async (req, res) => {
  try {
    const { title, author, category, image, description, totalCopies } = req.body;

    if (!title || !author || !category || !image || !description) {
      return res.status(400).json({
        success: false,
        message: 'অনুগ্রহ করে সকল আবশ্যকীয় তথ্য পূরণ করুন!',
      });
    }

    const newBook = await Book.create({
      title,
      author,
      category,
      image,
      description,
      totalCopies: Number(totalCopies) >= 0 ? Number(totalCopies) : 1,
      userEmail: req.user.email,
      userName: req.user.name || 'Anonymous',
    });

    res.status(201).json({
      success: true,
      message: 'বইটি সফলভাবে সংগ্রহে যুক্ত করা হয়েছে!',
      data: newBook,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'বই যোগ করতে সমস্যা হয়েছে: ' + error.message,
    });
  }
};

// @desc    Update a book
// @route   PATCH /books/:id
// @access  Private (Owner only)
export const updateBook = async (req, res) => {
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

    // Owner check
    if (book.userEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'অনধিকার চর্চা! আপনি শুধুমাত্র নিজের যোগ করা বই এডিট করতে পারবেন।',
      });
    }

    const { title, author, category, image, description, totalCopies } = req.body;

    if (title) book.title = title;
    if (author) book.author = author;
    if (category) book.category = category;
    if (image) book.image = image;
    if (description) book.description = description;
    if (totalCopies !== undefined) book.totalCopies = Math.max(0, Number(totalCopies));

    const updatedBook = await book.save();

    res.status(200).json({
      success: true,
      message: 'বইটির তথ্য সফলভাবে আপডেট করা হয়েছে!',
      data: updatedBook,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'বই আপডেট করতে ব্যর্থ: ' + error.message,
    });
  }
};

// @desc    Delete a book
// @route   DELETE /books/:id
// @access  Private (Owner only)
export const deleteBook = async (req, res) => {
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

    // Owner check
    if (book.userEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'অনধিকার চর্চা! আপনি শুধুমাত্র নিজের যোগ করা বই মুছে ফেলতে পারবেন।',
      });
    }

    await Book.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'বইটি সফলভাবে সংগ্রহ থেকে মুছে ফেলা হয়েছে!',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'বই মুছে ফেলতে ব্যর্থ: ' + error.message,
    });
  }
};
