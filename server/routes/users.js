// server/routes/users.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Wallet = require('../models/Wallet');

// @route   GET api/users/me
// @desc    Get current user's data
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    // req.user.id is coming from the auth middleware
    const user = await User.findById(req.user.id).select('-password');
    const wallet = await Wallet.findOne({ user: req.user.id });

    if (!user || !wallet) {
      return res.status(404).json({ msg: 'User or wallet not found' });
    }

    res.json({ user, wallet });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;