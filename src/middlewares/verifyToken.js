const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header: Bearer <token>
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'অননুমোদিত অ্যাক্সেস! কোনো টোকেন পাওয়া যায়নি। অনুগ্রহ করে লগইন করুন।',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'অবৈধ বা মেয়াদোত্তীর্ণ টোকেন! অনুগ্রহ করে পুনরায় লগইন করুন।',
      error: error.message,
    });
  }
};

module.exports = verifyToken;
