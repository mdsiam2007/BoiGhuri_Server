import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'বইয়ের নাম আবশ্যক'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'লেখকের নাম আবশ্যক'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'ক্যাটাগরি নির্বাচন করুন'],
      enum: {
        values: ['Fiction', 'Science', 'History', 'Kids', 'Others'],
        message: '{VALUE} একটি বৈধ ক্যাটাগরি নয়',
      },
    },
    image: {
      type: String,
      required: [true, 'বইয়ের কভার ছবি আবশ্যক'],
    },
    description: {
      type: String,
      required: [true, 'সংক্ষিপ্ত বিবরণ আবশ্যক'],
    },
    totalCopies: {
      type: Number,
      required: [true, 'মোট কপির সংখ্যা আবশ্যক'],
      min: [0, 'কপি সংখ্যা ঋণাত্মক হতে পারবে না'],
      default: 1,
    },
    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search & sorting efficiency
bookSchema.index({ title: 'text', author: 'text' });
bookSchema.index({ createdAt: -1 });

const Book = mongoose.model('Book', bookSchema);
export default Book;
