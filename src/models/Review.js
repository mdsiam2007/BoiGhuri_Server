import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book ID আবশ্যক'],
    },
    userEmail: {
      type: String,
      required: [true, 'ব্যবহারকারীর ইমেইল আবশ্যক'],
      trim: true,
      lowercase: true,
    },
    userName: {
      type: String,
      required: [true, 'ব্যবহারকারীর নাম আবশ্যক'],
      trim: true,
    },
    userImage: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      required: [true, 'রেটিং আবশ্যক'],
      min: [1, 'সর্বনিম্ন রেটিং ১'],
      max: [5, 'সর্বোচ্চ রেটিং ৫'],
    },
    comment: {
      type: String,
      required: [true, 'মতামত আবশ্যক'],
      trim: true,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// One review per user per book
reviewSchema.index({ bookId: 1, userEmail: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
