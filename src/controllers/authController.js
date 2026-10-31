import jwt from 'jsonwebtoken';
import { getBooksCollection, getReviewsCollection } from '../config/collections.js';

// @desc    Generate JWT token for authenticated user
// @route   POST /auth/jwt
// @access  Public (called after BetterAuth authentication)
export const createJwtToken = async (req, res) => {
  try {
    const { email, name, image } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'ইমেইল আবশ্যক!',
      });
    }

    const payload = {
      email: email.toLowerCase().trim(),
      name: name,
      image: image,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      token,
      user: payload,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'টোকেন তৈরিতে ব্যর্থ: ' + error.message,
    });
  }
};

// @desc    Update user profile name (User permission to edit their name)
// @route   PATCH /auth/profile
// @access  Private (JWT)
export const updateProfileName = async (req, res) => {
  try {
    const booksCollection = getBooksCollection();
    const reviewsCollection = getReviewsCollection();

    const { name, image } = req.body;
    const userEmail = req.user.email.toLowerCase().trim();

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'নাম খালি রাখা যাবে না!',
      });
    }

    const updatedName = name.trim();
    const updatedImage = image !== undefined ? image : req.user.image;

    // Update user's name across their added books and reviews
    await booksCollection.updateMany(
      { userEmail },
      { $set: { userName: updatedName } }
    );

    const reviewUpdate = { userName: updatedName };
    if (image) {
      reviewUpdate.userImage = updatedImage;
    }
    await reviewsCollection.updateMany({ userEmail }, { $set: reviewUpdate });

    const newPayload = {
      email: userEmail,
      name: updatedName,
      image: updatedImage,
    };

    const token = jwt.sign(newPayload, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'আপনার নাম সফলভাবে পরিবর্তন করা হয়েছে!',
      user: newPayload,
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে: ' + error.message,
    });
  }
};

// @desc    Clear JWT token
// @route   POST /auth/logout
// @access  Public
export const clearJwtToken = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });

  res.status(200).json({
    success: true,
    message: 'লগআউট সফল হয়েছে!',
  });
};
