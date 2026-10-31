import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Book from '../models/Book.js';

// @desc    Get all reviews for a book
// @route   GET /reviews?bookId=:bookId or GET /books/:bookId/reviews
// @access  Public
export const getBookReviews = async (req, res) => {
  try {
    const bookId = req.params.bookId || req.query.bookId;

    if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: 'বৈধ বুক আইডি আবশ্যক!',
      });
    }

    const reviews = await Review.find({ bookId }).sort({ createdAt: -1 });

    // Calculate average rating
    const averageRating =
      reviews.length > 0
        ? (
            reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length
          ).toFixed(1)
        : 0;

    res.status(200).json({
      success: true,
      count: reviews.length,
      averageRating: Number(averageRating),
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'রিভিউ লোড করতে ব্যর্থ: ' + error.message,
    });
  }
};

// @desc    Add a review for a book
// @route   POST /reviews
// @access  Private (JWT required)
export const addReview = async (req, res) => {
  try {
    const { bookId, rating, comment } = req.body;
    const userEmail = req.user.email.toLowerCase().trim();
    const userName = req.user.name || 'Anonymous';
    const userImage = req.user.image || '';

    if (!bookId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'বুক আইডি, রেটিং ও মন্তব্য প্রদান করা আবশ্যক!',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: 'অকার্যকর বুক আইডি!',
      });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'রেটিং অবশ্যই ১ থেকে ৫ এর মধ্যে হতে হবে!',
      });
    }

    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'বইটি খুঁজে পাওয়া যায়নি!',
      });
    }

    // Check if user already reviewed this book (1 review per user rule)
    const existingReview = await Review.findOne({ bookId, userEmail });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'আপনি ইতিমধ্যে এই বইটিতে একটি রিভিউ দিয়েছেন! চাইলে পূর্বের রিভিউটি এডিট করতে পারেন।',
      });
    }

    const review = await Review.create({
      bookId,
      userEmail,
      userName,
      userImage,
      rating: numericRating,
      comment: comment.trim(),
      isEdited: false,
    });

    res.status(201).json({
      success: true,
      message: 'আপনার রিভিউ সফলভাবে প্রকাশ করা হয়েছে!',
      data: review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'রিভিউ প্রকাশ করতে সমস্যা হয়েছে: ' + error.message,
    });
  }
};

// @desc    Edit user review
// @route   PATCH /reviews/:id
// @access  Private (Owner only)
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userEmail = req.user.email.toLowerCase().trim();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'অকার্যকর রিভিউ আইডি!',
      });
    }

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'রিভিউটি পাওয়া যায়নি!',
      });
    }

    // Check owner
    if (review.userEmail.toLowerCase() !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'অনধিকার চর্চা! আপনি শুধুমাত্র নিজের দেওয়া রিভিউ এডিট করতে পারবেন।',
      });
    }

    if (rating !== undefined) {
      const numericRating = Number(rating);
      if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({
          success: false,
          message: 'রেটিং অবশ্যই ১ থেকে ৫ এর মধ্যে হতে হবে!',
        });
      }
      review.rating = numericRating;
    }

    if (comment !== undefined && comment.trim() !== '') {
      review.comment = comment.trim();
    }

    // Mark as edited
    review.isEdited = true;

    const updatedReview = await review.save();

    res.status(200).json({
      success: true,
      message: 'রিভিউ সফলভাবে আপডেট করা হয়েছে!',
      data: updatedReview,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'রিভিউ আপডেট করতে ব্যর্থ: ' + error.message,
    });
  }
};

// @desc    Delete user review
// @route   DELETE /reviews/:id
// @access  Private (Owner only)
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user.email.toLowerCase().trim();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'অকার্যকর রিভিউ আইডি!',
      });
    }

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'রিভিউটি পাওয়া যায়নি!',
      });
    }

    if (review.userEmail.toLowerCase() !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'অনধিকার চর্চা! আপনি শুধুমাত্র নিজের দেওয়া রিভিউ ডিলিট করতে পারবেন।',
      });
    }

    await Review.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'রিভিউ সফলভাবে মুছে ফেলা হয়েছে!',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'রিভিউ মুছে ফেলতে ব্যর্থ: ' + error.message,
    });
  }
};
