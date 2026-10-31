const express = require('express');
const router = express.Router();
const { createJwtToken, clearJwtToken } = require('../controllers/authController');

router.post('/jwt', createJwtToken);
router.post('/logout', clearJwtToken);

module.exports = router;
