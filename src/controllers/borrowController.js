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
        message: 'বই আইডি এবং ফেরত দেওয়ার তারিখ আবশ্যক!',
      });
    }

    if (!ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: 'অকার্যকর বুক আইডি!',
      });
    }

    const bookObjectId = new ObjectId(bookId);

    // Challenge 2: No Double Borrow check
    const existingBorrow = await borrowsCollection.findOne({
      bookId: bookObjectId,
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
    const updateResult = await booksCollection.findOneAndUpdate(
      { _id: bookObjectId, totalCopies: { $gt: 0 } },
      { $inc: { totalCopies: -1 } },
      { returnDocument: 'after' }
    );

    const updatedBook = updateResult?.value || updateResult;

    if (!updatedBook || updatedBook.totalCopies < 0) {
      return res.status(400).json({
        success: false,
        message: 'দুঃখিত, এই বইটির কোনো কপি বর্তমানে লাইব্রেরিতে অবশিষ্ট নেই!',
      });
    }

    // Create borrow record
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
      message: `"${updatedBook.title}" বইটি সফলভাবে ধার নেওয়া হয়েছে!`,
      data: {
        _id: insertResult.insertedId,
        ...borrowDoc,
      },
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
      message: 'ধার করা বইয়ের তালিকা আনতে ব্যর্থ: ' + error.message,
    });
  }
};

// @desc    Return a book (DELETE /borrows/:id)
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
        message: 'অকার্যকর বরো আইডি!',
      });
    }

    const borrowRecord = await borrowsCollection.findOne({ _id: new ObjectId(id) });

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
    await booksCollection.updateOne(
      { _id: new ObjectId(borrowRecord.bookId) },
      { $inc: { totalCopies: 1 } }
    );

    // Delete the borrow record from database
    await borrowsCollection.deleteOne({ _id: new ObjectId(id) });

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
