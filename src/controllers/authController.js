const jwt = require('jsonwebtoken');

// @desc    Generate JWT token for authenticated user
// @route   POST /auth/jwt
// @access  Public (called after BetterAuth authentication)
const createJwtToken = async (req, res) => {
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
      name: name || 'User',
      image: image || '',
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    // Also set httpOnly cookie for convenience
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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

// @desc    Clear JWT token
// @route   POST /auth/logout
// @access  Public
const clearJwtToken = (req, res) => {
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

module.exports = {
  createJwtToken,
  clearJwtToken,
};
