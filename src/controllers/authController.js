import jwt from 'jsonwebtoken';
import {
  getBooksCollection,
  getReviewsCollection,
  getBorrowsCollection,
  getUsersCollection,
} from '../config/collections.js';

// @desc    Generate JWT token for authenticated user
// @route   POST /auth/jwt
// @access  Public
export const createJwtToken = async (req, res) => {
  try {
    const { email, name, image } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const usersCollection = getUsersCollection();
    const existingUser = await usersCollection.findOne({
      email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') },
    });

    const payload = {
      email: cleanEmail,
      name: name || existingUser?.name || cleanEmail.split('@')[0],
      image: image !== undefined ? image : (existingUser?.image || ''),
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
      message: 'Failed to generate token: ' + error.message,
    });
  }
};

// @desc    Update user profile name and image
// @route   PATCH /auth/profile
// @access  Private (JWT)
export const updateProfileName = async (req, res) => {
  try {
    const booksCollection = getBooksCollection();
    const reviewsCollection = getReviewsCollection();
    const borrowsCollection = getBorrowsCollection();
    const usersCollection = getUsersCollection();

    const { name, image } = req.body;
    const userEmail = req.user.email.toLowerCase().trim();

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name cannot be empty',
      });
    }

    const updatedName = name.trim();
    const updatedImage = image !== undefined ? image : (req.user.image || '');

    // 1. Update user document in MongoDB (Better-Auth user collection)
    const userUpdateFields = {
      name: updatedName,
      updatedAt: new Date(),
    };
    if (image !== undefined) {
      userUpdateFields.image = updatedImage;
    }
    await usersCollection.updateOne(
      { email: { $regex: new RegExp(`^${userEmail}$`, 'i') } },
      { $set: userUpdateFields }
    );

    // 2. Update user's name across their added books
    await booksCollection.updateMany(
      { userEmail },
      { $set: { userName: updatedName } }
    );

    // 3. Update reviews
    const reviewUpdate = { userName: updatedName };
    if (image !== undefined) {
      reviewUpdate.userImage = updatedImage;
    }
    await reviewsCollection.updateMany({ userEmail }, { $set: reviewUpdate });

    // 4. Update borrows
    await borrowsCollection.updateMany(
      { userEmail },
      { $set: { userName: updatedName } }
    );

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
      message: 'Profile updated successfully',
      user: newPayload,
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile: ' + error.message,
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
    message: 'Logged out successfully',
  });
};
