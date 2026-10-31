import mongoose from 'mongoose';

const borrowSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book ID আবশ্যক'],
    },
    bookTitle: {
      type: String,
      required: [true, 'বইয়ের নাম আবশ্যক'],
      trim: true,
    },
    bookImage: {
      type: String,
      required: [true, 'বইয়ের ছবি আবশ্যক'],
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
    borrowDate: {
      type: Date,
      default: Date.now,
    },
    returnDate: {
      type: Date,
      required: [true, 'ফেরত দেওয়ার তারিখ আবশ্যক'],
    },
    status: {
      type: String,
      enum: ['borrowed', 'returned'],
      default: 'borrowed',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookup by user and active borrows
borrowSchema.index({ userEmail: 1, status: 1 });
borrowSchema.index({ bookId: 1, userEmail: 1, status: 1 });

const Borrow = mongoose.model('Borrow', borrowSchema);
export default Borrow;
