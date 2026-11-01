import { ObjectId } from 'mongodb';
import { getBooksCollection } from '../config/collections.js';

// @desc    Get all books with optional filters (category, search, sort, userEmail, limit)
// @route   GET /books
// @access  Public
export const getAllBooks = async (req, res) => {
  try {
    const booksCollection = getBooksCollection();
    const { limit, sort, category, search, userEmail } = req.query;

    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (userEmail) {
      query.userEmail = userEmail.toLowerCase();
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
      ];
    }

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

    let cursor = booksCollection.find(query).sort(sortOption);

    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        cursor = cursor.limit(parsedLimit);
      }
    }

    const books = await cursor.toArray();

    res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch books: ' + error.message,
    });
  }
};

// @desc    Get single book by ID
// @route   GET /books/:id
// @access  Public
export const getBookById = async (req, res) => {
  try {
    const booksCollection = getBooksCollection();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID',
      });
    }

    const book = await booksCollection.findOne({ _id: new ObjectId(id) });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch book details: ' + error.message,
    });
  }
};

// @desc    Add a new book
// @route   POST /books
// @access  Private (JWT)
export const createBook = async (req, res) => {
  try {
    const booksCollection = getBooksCollection();
    const { title, author, category, image, description, totalCopies } = req.body;

    if (!title || !author || !category || !image || !description) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided',
      });
    }

    const newBookDoc = {
      title,
      author,
      category,
      image,
      description,
      totalCopies: Number(totalCopies) >= 0 ? Number(totalCopies) : 1,
      userEmail: req.user.email,
      userName: req.user.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await booksCollection.insertOne(newBookDoc);

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: {
        _id: result.insertedId,
        ...newBookDoc,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create book: ' + error.message,
    });
  }
};

// @desc    Update a book
// @route   PATCH /books/:id
// @access  Private (Owner only)
export const updateBook = async (req, res) => {
  try {
    const booksCollection = getBooksCollection();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID',
      });
    }

    const book = await booksCollection.findOne({ _id: new ObjectId(id) });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    if (book.userEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only update books you created.',
      });
    }

    const { title, author, category, image, description, totalCopies } = req.body;

    const updateFields = {
      updatedAt: new Date(),
    };

    if (title) updateFields.title = title;
    if (author) updateFields.author = author;
    if (category) updateFields.category = category;
    if (image) updateFields.image = image;
    if (description) updateFields.description = description;
    if (totalCopies !== undefined) updateFields.totalCopies = Math.max(0, Number(totalCopies));

    await booksCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    const updatedBook = await booksCollection.findOne({ _id: new ObjectId(id) });

    res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      data: updatedBook,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update book: ' + error.message,
    });
  }
};

// @desc    Delete a book
// @route   DELETE /books/:id
// @access  Private (Owner only)
export const deleteBook = async (req, res) => {
  try {
    const booksCollection = getBooksCollection();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID',
      });
    }

    const book = await booksCollection.findOne({ _id: new ObjectId(id) });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    if (book.userEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only delete books you created.',
      });
    }

    await booksCollection.deleteOne({ _id: new ObjectId(id) });

    res.status(200).json({
      success: true,
      message: 'Book deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete book: ' + error.message,
    });
  }
};
