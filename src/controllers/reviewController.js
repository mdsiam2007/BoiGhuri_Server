import { ObjectId } from 'mongodb';
import { getReviewsCollection, getBooksCollection } from '../config/collections.js';

// @desc    Get all reviews for a book
// @route   GET /reviews?bookId=:bookId or GET /books/:bookId/reviews
// @access  Public
export const getBookReviews = async (req, res) => {
  try {
    const reviewsCollection = getReviewsCollection();
    const bookId = req.params.bookId || req.query.bookId;

    if (!bookId || !ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: 'বৈধ বুক আইডি আবশ্যক!',
      });
    }

    const reviews = await reviewsCollection
      .find({ bookId: new ObjectId(bookId) })
      .sort({ createdAt: -1 })
      .toArray();

    const averageRating =
      reviews.length > 0
        ? Number(
            (
              reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length
            ).toFixed(1)
          )
        : 0;

    res.status(200).json({
      success: true,
      count: reviews.length,
      averageRating,
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
    const reviewsCollection = getReviewsCollection();
    const booksCollection = getBooksCollection();

    const { bookId, rating, comment } = req.body;
    const userEmail = req.user.email.toLowerCase().trim();
    const userName = req.user.name;
    const userImage = req.user.image;

    if (!bookId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'বুক আইডি, রেটিং ও মন্তব্য প্রদান করা আবশ্যক!',
      });
    }

    if (!ObjectId.isValid(bookId)) {
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

    const bookObjectId = new ObjectId(bookId);

    // Check if book exists
    const book = await booksCollection.findOne({ _id: bookObjectId });
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'বইটি খুঁজে পাওয়া যায়নি!',
      });
    }

    // Check if user already reviewed this book (1 review per user rule)
    const existingReview = await reviewsCollection.findOne({
      bookId: bookObjectId,
      userEmail,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'আপনি ইতিমধ্যে এই বইটিতে একটি রিভিউ দিয়েছেন! চাইলে পূর্বের রিভিউটি এডিট করতে পারেন।',
      });
    }

    const reviewDoc = {
      bookId: bookObjectId,
      userEmail,
      userName,
      userImage,
      rating: numericRating,
      comment: comment.trim(),
      isEdited: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertResult = await reviewsCollection.insertOne(reviewDoc);

    res.status(201).json({
      success: true,
      message: 'আপনার রিভিউ সফলভাবে প্রকাশ করা হয়েছে!',
      data: {
        _id: insertResult.insertedId,
        ...reviewDoc,
      },
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
    const reviewsCollection = getReviewsCollection();
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userEmail = req.user.email.toLowerCase().trim();

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'অকার্যকর রিভিউ আইডি!',
      });
    }

    const review = await reviewsCollection.findOne({ _id: new ObjectId(id) });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'রিভিউটি পাওয়া যায়নি!',
      });
    }

    if (review.userEmail.toLowerCase() !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'অনধিকার চর্চা! আপনি শুধুমাত্র নিজের দেওয়া রিভিউ এডিট করতে পারবেন।',
      });
    }

    const updateFields = {
      isEdited: true,
      updatedAt: new Date(),
    };

    if (rating !== undefined) {
      const numericRating = Number(rating);
      if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({
          success: false,
          message: 'রেটিং অবশ্যই ১ থেকে ৫ এর মধ্যে হতে হবে!',
        });
      }
      updateFields.rating = numericRating;
    }

    if (comment !== undefined && comment.trim() !== '') {
      updateFields.comment = comment.trim();
    }

    await reviewsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    const updatedReview = await reviewsCollection.findOne({ _id: new ObjectId(id) });

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
    const reviewsCollection = getReviewsCollection();
    const { id } = req.params;
    const userEmail = req.user.email.toLowerCase().trim();

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'অকার্যকর রিভিউ আইডি!',
      });
    }

    const review = await reviewsCollection.findOne({ _id: new ObjectId(id) });

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

    await reviewsCollection.deleteOne({ _id: new ObjectId(id) });

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
