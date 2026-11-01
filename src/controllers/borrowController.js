import { ObjectId } from 'mongodb';
import { getBooksCollection, getBorrowsCollection } from '../config/collections.js';

// @desc    Borrow a book
// @route   POST /borrows
// @access  Private (JWT)
export const borrowBook = async (req, res) => {
  try {
    const booksCollection = getBooksCollection();
    const borrowsCollection = getBorrowsCollection();

    const { bookId, returnDate } = req.body;
    const userEmail = req.user.email.toLowerCase().trim();
    const userName = req.user.name;

    if (!bookId || !returnDate) {
      return res.status(400).json({
        success: false,
        message: 'Book ID and return date are required',
      });
    }

    if (!ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID',
      });
    }

    const bookObjectId = new ObjectId(bookId);

    // Prevent double borrowing
    const existingBorrow = await borrowsCollection.findOne({
      bookId: bookObjectId,
      userEmail,
      status: 'borrowed',
    });

    if (existingBorrow) {
      return res.status(400).json({
        success: false,
        message: 'You have already borrowed this book. Please return it before borrowing again.',
      });
    }

    // Decrement available copies by 1 atomically if totalCopies > 0
    const updateResult = await booksCollection.findOneAndUpdate(
      { _id: bookObjectId, totalCopies: { $gt: 0 } },
      { $inc: { totalCopies: -1 } },
      { returnDocument: 'after' }
    );

    const updatedBook = updateResult?.value || updateResult;

    if (!updatedBook || updatedBook.totalCopies < 0) {
      return res.status(400).json({
        success: false,
        message: 'Sorry, no copies of this book are currently available in the library.',
      });
    }

    const borrowDoc = {
      bookId: bookObjectId,
      bookTitle: updatedBook.title,
      bookImage: updatedBook.image,
      userEmail,
      userName,
      borrowDate: new Date(),
      returnDate: new Date(returnDate),
      status: 'borrowed',
      createdAt: new Date(),
    };

    const insertResult = await borrowsCollection.insertOne(borrowDoc);

    res.status(201).json({
      success: true,
      message: `"${updatedBook.title}" borrowed successfully`,
      data: {
        _id: insertResult.insertedId,
        ...borrowDoc,
      },
      remainingCopies: updatedBook.totalCopies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to borrow book: ' + error.message,
    });
  }
};

// @desc    Get borrows of the logged in user
// @route   GET /borrows
// @access  Private (JWT)
export const getMyBorrows = async (req, res) => {
  try {
    const borrowsCollection = getBorrowsCollection();
    const userEmail = req.user.email.toLowerCase().trim();

    const borrows = await borrowsCollection
      .find({
        userEmail,
        status: 'borrowed',
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      count: borrows.length,
      data: borrows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch borrowed books: ' + error.message,
    });
  }
};

// @desc    Return a book
// @route   DELETE /borrows/:id
// @access  Private (JWT)
export const returnBook = async (req, res) => {
  try {
    const booksCollection = getBooksCollection();
    const borrowsCollection = getBorrowsCollection();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid borrow ID',
      });
    }

    const borrowRecord = await borrowsCollection.findOne({ _id: new ObjectId(id) });

    if (!borrowRecord) {
      return res.status(404).json({
        success: false,
        message: 'Borrow record not found',
      });
    }

    // Verify ownership
    if (borrowRecord.userEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only return books you borrowed.',
      });
    }

    // Increment available copies by 1 atomically
    await booksCollection.updateOne(
      { _id: new ObjectId(borrowRecord.bookId) },
      { $inc: { totalCopies: 1 } }
    );

    // Delete borrow record upon return
    await borrowsCollection.deleteOne({ _id: new ObjectId(id) });

    res.status(200).json({
      success: true,
      message: `"${borrowRecord.bookTitle}" returned successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to return book: ' + error.message,
    });
  }
};
