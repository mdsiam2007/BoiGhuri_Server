import { ObjectId } from 'mongodb';
import {
  getReviewsCollection,
  getBooksCollection,
  getBorrowsCollection,
} from '../config/collections.js';

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
        message: 'Valid book ID is required',
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
      message: 'Failed to fetch reviews: ' + error.message,
    });
  }
};

// @desc    Add a review for a book (Must have borrowed the book)
// @route   POST /reviews
// @access  Private (JWT required)
export const addReview = async (req, res) => {
  try {
    const reviewsCollection = getReviewsCollection();
    const booksCollection = getBooksCollection();
    const borrowsCollection = getBorrowsCollection();

    const { bookId, rating, comment } = req.body;
    const userEmail = req.user.email.toLowerCase().trim();
    const userName = req.user.name;
    const userImage = req.user.image;

    if (!bookId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Book ID, rating and comment are required',
      });
    }

    if (!ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID',
      });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a number between 1 and 5',
      });
    }

    const bookObjectId = new ObjectId(bookId);

    // Check if book exists
    const book = await booksCollection.findOne({ _id: bookObjectId });
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    // Constraint: User MUST have borrowed the book to submit a review
    const hasBorrowed = await borrowsCollection.findOne({
      bookId: bookObjectId,
      userEmail,
    });

    if (!hasBorrowed) {
      return res.status(403).json({
        success: false,
        message: 'You must borrow this book before you can submit a review.',
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
        message: 'You have already submitted a review for this book. You can edit your existing review.',
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
      message: 'Review submitted successfully',
      data: {
        _id: insertResult.insertedId,
        ...reviewDoc,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit review: ' + error.message,
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
        message: 'Invalid review ID',
      });
    }

    const review = await reviewsCollection.findOne({ _id: new ObjectId(id) });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    if (review.userEmail.toLowerCase() !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only edit your own reviews.',
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
          message: 'Rating must be a number between 1 and 5',
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
      message: 'Review updated successfully',
      data: updatedReview,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update review: ' + error.message,
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
        message: 'Invalid review ID',
      });
    }

    const review = await reviewsCollection.findOne({ _id: new ObjectId(id) });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    if (review.userEmail.toLowerCase() !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only delete your own reviews.',
      });
    }

    await reviewsCollection.deleteOne({ _id: new ObjectId(id) });

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete review: ' + error.message,
    });
  }
};
