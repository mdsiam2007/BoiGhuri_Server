import { ObjectId } from 'mongodb';
import { getBooksCollection } from '../config/collections.js';

// @desc    Get all books (with optional sort, limit, category, search, userEmail filters)
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

    // Default newest first: sort by createdAt descending
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
      message: 'বই লোড করতে সমস্যা হয়েছে: ' + error.message,
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
        message: 'অকার্যকর বুক আইডি!',
      });
    }

    const book = await booksCollection.findOne({ _id: new ObjectId(id) });

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
    const booksCollection = getBooksCollection();
    const { title, author, category, image, description, totalCopies } = req.body;

    if (!title || !author || !category || !image || !description) {
      return res.status(400).json({
        success: false,
        message: 'অনুগ্রহ করে সকল আবশ্যকীয় তথ্য পূরণ করুন!',
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
      message: 'বইটি সফলভাবে সংগ্রহে যুক্ত করা হয়েছে!',
      data: {
        _id: result.insertedId,
        ...newBookDoc,
      },
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
    const booksCollection = getBooksCollection();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'অকার্যকর বুক আইডি!',
      });
    }

    const book = await booksCollection.findOne({ _id: new ObjectId(id) });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'বইটি খুঁজে পাওয়া যায়নি!',
      });
    }

    if (book.userEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'অনধিকার চর্চা! আপনি শুধুমাত্র নিজের যোগ করা বই এডিট করতে পারবেন।',
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
    const booksCollection = getBooksCollection();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'অকার্যকর বুক আইডি!',
      });
    }

    const book = await booksCollection.findOne({ _id: new ObjectId(id) });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'বইটি খুঁজে পাওয়া যায়নি!',
      });
    }

    if (book.userEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'অনধিকার চর্চা! আপনি শুধুমাত্র নিজের যোগ করা বই মুছে ফেলতে পারবেন।',
      });
    }

    await booksCollection.deleteOne({ _id: new ObjectId(id) });

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
