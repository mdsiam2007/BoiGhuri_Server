import mongoose from 'mongoose';
import Borrow from '../models/Borrow.js';
import Book from '../models/Book.js';

// @desc    Borrow a book
// @route   POST /borrows
// @access  Private (JWT)
export const borrowBook = async (req, res) => {
  try {
    const { bookId, returnDate } = req.body;
    const userEmail = req.user.email.toLowerCase().trim();
    const userName = req.user.name || 'Anonymous';

    if (!bookId || !returnDate) {
      return res.status(400).json({
        success: false,
        message: 'বই আইডি এবং ফেরত দেওয়ার তারিখ আবশ্যক!',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: 'অকার্যকর বুক আইডি!',
      });
    }

    // Challenge 2: No Double Borrow check
    const existingBorrow = await Borrow.findOne({
      bookId,
      userEmail,
      status: 'borrowed',
    });

    if (existingBorrow) {
      return res.status(400).json({
        success: false,
        message: 'আপনি ইতিমধ্যে এই বইটি ধার নিয়েছেন! ফেরত না দেওয়া পর্যন্ত পুনরায় নিতে পারবেন না।',
      });
    }

    // Challenge 1: Decrease available copies by 1 with $inc if totalCopies > 0
    const updatedBook = await Book.findOneAndUpdate(
      { _id: bookId, totalCopies: { $gt: 0 } },
      { $inc: { totalCopies: -1 } },
      { new: true }
    );

    if (!updatedBook) {
      return res.status(400).json({
        success: false,
        message: 'দুঃখিত, এই বইটির কোনো কপি বর্তমানে লাইব্রেরিতে অবশিষ্ট নেই!',
      });
    }

    // Create borrow record
    const borrowRecord = await Borrow.create({
      bookId,
      bookTitle: updatedBook.title,
      bookImage: updatedBook.image,
      userEmail,
      userName,
      borrowDate: new Date(),
      returnDate: new Date(returnDate),
      status: 'borrowed',
    });

    res.status(201).json({
      success: true,
      message: `"${updatedBook.title}" বইটি সফলভাবে ধার নেওয়া হয়েছে!`,
      data: borrowRecord,
      remainingCopies: updatedBook.totalCopies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'বই ধার নিতে সমস্যা হয়েছে: ' + error.message,
    });
  }
};

// @desc    Get borrows of the logged in user
// @route   GET /borrows
// @access  Private (JWT)
export const getMyBorrows = async (req, res) => {
  try {
    const userEmail = req.user.email.toLowerCase().trim();

    const borrows = await Borrow.find({
      userEmail,
      status: 'borrowed',
    })
      .sort({ createdAt: -1 })
      .populate('bookId', 'category author description');

    res.status(200).json({
      success: true,
      count: borrows.length,
      data: borrows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'ধার করা বইয়ের তালিকা আনতে ব্যর্থ: ' + error.message,
    });
  }
};

// @desc    Return a book (DELETE /borrows/:id)
// @route   DELETE /borrows/:id
// @access  Private (JWT)
export const returnBook = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'অকার্যকর বরো আইডি!',
      });
    }

    const borrowRecord = await Borrow.findById(id);

    if (!borrowRecord) {
      return res.status(404).json({
        success: false,
        message: 'ধার নেওয়ার রেকর্ডটি পাওয়া যায়নি!',
      });
    }

    // Owner check
    if (borrowRecord.userEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'অনধিকার চর্চা! আপনি শুধুমাত্র আপনার ধার করা বই ফেরত দিতে পারবেন।',
      });
    }

    // Challenge 1: Increase available copies by 1 with $inc
    await Book.findByIdAndUpdate(borrowRecord.bookId, {
      $inc: { totalCopies: 1 },
    });

    // Delete the borrow record from database
    await Borrow.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: `"${borrowRecord.bookTitle}" বইটি সফলভাবে লাইব্রেরিতে ফেরত দেওয়া হয়েছে!`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'বই ফেরত দিতে সমস্যা হয়েছে: ' + error.message,
    });
  }
};
