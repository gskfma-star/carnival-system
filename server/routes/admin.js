const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { Parser } = require('json2csv');

// --- Middleware ---
const superAdminAuth = require('../middleware/superAdminAuth');
const adminAuth = require('../middleware/adminAuth');
const subAdminAuth = require('../middleware/subAdminAuth');

// --- Models ---
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

// --- Nodemailer Transporter Setup ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// --- ROUTES FOR SUB ADMINS (AND ABOVE) ---

/**
 * @route   GET api/admin/search-students
 * @desc    Search for student users by name or username
 * @access  Private (SubAdmin, Admin, SuperAdmin)
 */
router.get('/search-students', subAdminAuth, async (req, res) => {
    try {
        const searchTerm = req.query.search || '';
        if (searchTerm.length < 2) return res.json([]);
        
        const users = await User.find({
            role: 'Student',
            $or: [
                { fullName: { $regex: searchTerm, $options: 'i' } },
                { username: { $regex: searchTerm, $options: 'i' } }
            ]
        }).select('-password').limit(10);
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   POST api/admin/recharge
 * @desc    Recharge a user's wallet (add only)
 * @access  Private (SubAdmin, Admin, SuperAdmin)
 */
router.post('/recharge', subAdminAuth, async (req, res) => {
    const { userId, amount } = req.body;
    const rechargeAmount = Number(amount);

    if (!userId || !rechargeAmount || rechargeAmount <= 0) {
        return res.status(400).json({ msg: 'User ID and a positive amount are required' });
    }

    try {
        const wallet = await Wallet.findOne({ user: userId });
        if (!wallet) return res.status(404).json({ msg: 'Wallet not found' });

        wallet.balance += rechargeAmount;
        await wallet.save();

        const transaction = new Transaction({
            sender: req.user.id,
            receiver: userId,
            amount: rechargeAmount,
            type: 'credit',
        });
        await transaction.save();

        res.json({ msg: 'Recharge successful', newBalance: wallet.balance });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- ROUTES FOR ADMINS (AND ABOVE) ---

/**
 * @route   GET api/admin/view-users
 * @desc    Get a list of all Students and Vendors
 * @access  Private (Admin, SuperAdmin)
 */
router.get('/view-users', adminAuth, async (req, res) => {
    try {
        const users = await User.aggregate([
            { $match: { role: { $in: ['Student', 'Vendor'] } } },
            { $lookup: { from: 'wallets', localField: '_id', foreignField: 'user', as: 'walletInfo' } },
            { $unwind: { path: '$walletInfo', preserveNullAndEmptyArrays: true } },
            { $project: { password: 0 } }
        ]);
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- ROUTES FOR SUPER ADMINS ONLY ---

/**
 * @route   GET api/admin/users
 * @desc    Get all users with their wallet balances
 * @access  Private (SuperAdmin only)
 */
router.get('/users', superAdminAuth, async (req, res) => {
  try {
    const users = await User.aggregate([
      { $lookup: { from: 'wallets', localField: '_id', foreignField: 'user', as: 'walletInfo' } },
      { $unwind: { path: '$walletInfo', preserveNullAndEmptyArrays: true } },
      { $project: { password: 0 } }
    ]);
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   POST api/admin/users
 * @desc    Create a new user (SuperAdmin can create any role, Admin can only create Students)
 * @access  Private (Admin, SuperAdmin)
 */
router.post('/users', adminAuth, async (req, res) => {
  const { username, email, role } = req.body;

  if (req.user.role === 'Admin' && role !== 'Student') {
      return res.status(403).json({ msg: 'Admins can only create Student accounts.' });
  }
  if (!username || !email || !role) return res.status(400).json({ msg: 'Please provide all fields' });
  
  try {
    let user = await User.findOne({ username });
    if (user) return res.status(400).json({ msg: 'Username already exists' });

    let emailExists = await User.findOne({ email });
    if (emailExists) return res.status(400).json({ msg: 'An account with this email already exists' });

    const password = crypto.randomBytes(8).toString('hex');
    const fullName = username;
    user = new User({ username, password, fullName, role, email });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const initialBalance = role === 'Student' ? 600 : 0;
    const wallet = new Wallet({ user: user.id, balance: initialBalance });
    await wallet.save();

    const loginUrl = `${process.env.CLIENT_URL}/login`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your New Account for the School Carnival!',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h1>Welcome!</h1>
                <p>A new account has been created for you by an admin.</p>
                <p>You can log in with the following credentials:</p>
                <ul>
                    <li><strong>Username:</strong> ${username}</li>
                    <li><strong>Password:</strong> ${password}</li>
                </ul>
                <a href="${loginUrl}" style="background-color: #007bff; color: white; padding: 12px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px; font-size: 16px;">
                    Click Here to Login
                </a>
            </div>
        `
    };
    await transporter.sendMail(mailOptions);

    const userResponse = { ...user.toObject() };
    delete userResponse.password;
    res.status(201).json(userResponse);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   DELETE api/admin/users/:id
 * @desc    Delete a user and all their data
 * @access  Private (SuperAdmin only)
 */
router.delete('/users/:id', superAdminAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    await Transaction.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });
    await Wallet.findOneAndDelete({ user: userId });
    await User.findByIdAndDelete(userId);
    res.json({ msg: 'User and all associated data deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   PUT api/admin/users/:id/change-password
 * @desc    Super Admin changes a user's password
 * @access  Private (SuperAdmin only)
 */
router.put('/users/:id/change-password', superAdminAuth, async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ msg: 'Please enter a password with 6 or more characters' });
    }
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Your Password Has Been Changed',
            html: `<h1>Password Changed</h1><p>Hello ${user.fullName},</p><p>An administrator has changed the password for your account.</p><p>Your new password is: <strong>${newPassword}</strong></p>`
        };
        await transporter.sendMail(mailOptions);

        res.json({ msg: 'Password updated and notification sent successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   POST api/admin/wallet/adjust
 * @desc    Super Admin can add or remove tokens from a user's wallet
 * @access  Private (SuperAdmin only)
 */
router.post('/wallet/adjust', superAdminAuth, async (req, res) => {
  const { userId, amount } = req.body;
  if (!userId || !amount) {
    return res.status(400).json({ msg: 'User ID and amount are required' });
  }
  try {
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) return res.status(404).json({ msg: 'Wallet not found' });
    
    wallet.balance += Number(amount);
    await wallet.save();

    const transaction = new Transaction({
      sender: req.user.id,
      receiver: userId,
      amount: Math.abs(amount),
      type: Number(amount) > 0 ? 'credit' : 'debit',
    });
    await transaction.save();
    res.json(wallet);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET api/admin/transactions/:userId
 * @desc    Super Admin gets all transactions for a specific user
 * @access  Private (SuperAdmin only)
 */
router.get('/transactions/:userId', superAdminAuth, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      $or: [{ sender: req.params.userId }, { receiver: req.params.userId }],
    })
      .populate('sender', 'fullName')
      .populate('receiver', 'fullName')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET api/admin/export/transactions
 * @desc    Super Admin exports transactions as a CSV file.
 * @access  Private (SuperAdmin only)
 */
router.get('/export/transactions', superAdminAuth, async (req, res) => {
    try {
        const { userId } = req.query;
        let queryFilter = {};
        let filename = 'all-transactions.csv';
        if (userId) {
            queryFilter = { $or: [{ sender: userId }, { receiver: userId }] };
            filename = `user_${userId}_transactions.csv`;
        }

        const transactions = await Transaction.find(queryFilter)
            .populate('sender', 'fullName username')
            .populate('receiver', 'fullName username')
            .sort({ createdAt: 'desc' });

        const fields = [
            { label: 'Date', value: 'createdAt' },
            { label: 'Sender Name', value: 'sender.fullName' },
            { label: 'Sender Username', value: 'sender.username' },
            { label: 'Receiver Name', value: 'receiver.fullName' },
            { label: 'Receiver Username', value: 'receiver.username' },
            { label: 'Amount', value: 'amount' },
            { label: 'Type', value: 'type' },
            { label: 'Transaction ID', value: '_id' },
        ];

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(transactions);

        res.header('Content-Type', 'text/csv');
        res.attachment(filename);
        res.send(csv);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;