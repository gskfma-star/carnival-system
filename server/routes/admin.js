const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { Parser } = require('json2csv');
const superAdminAuth = require('../middleware/superAdminAuth');
const adminAuth = require('../middleware/adminAuth');
const subAdminAuth = require('../middleware/subAdminAuth');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const ApprovalRequest = require('../models/ApprovalRequest');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// --- ROUTES FOR SUB ADMINS (AND ABOVE) ---
router.get('/search-students', subAdminAuth, async (req, res) => {
    try {
        const searchTerm = req.query.search || '';
        if (searchTerm.length < 2) return res.json([]);
        const users = await User.find({
            role: 'Student',
            $or: [{ fullName: { $regex: searchTerm, $options: 'i' } }, { username: { $regex: searchTerm, $options: 'i' } }]
        }).select('-password').limit(10);
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
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
        const transaction = new Transaction({ sender: req.user.id, receiver: userId, amount: rechargeAmount, type: 'credit' });
        await transaction.save();
        res.json({ msg: 'Recharge successful', newBalance: wallet.balance });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- ROUTES FOR ADMINS (AND ABOVE) ---
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
router.post('/request-adjustment', adminAuth, async (req, res) => {
    const { targetUserId, amount } = req.body;
    if (!targetUserId || !amount) {
        return res.status(400).json({ msg: 'Target User ID and amount are required' });
    }
    try {
        const request = new ApprovalRequest({ requestedBy: req.user.id, targetUser: targetUserId, amount: Number(amount) });
        await request.save();
        res.status(201).json({ msg: 'Request submitted successfully for approval' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- ROUTES FOR SUPER ADMINS ONLY ---
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
    const mailOptions = { from: process.env.EMAIL_USER, to: email, subject: 'Your New Account for the School Carnival!', html: `<h1>Welcome!</h1><p>A new account has been created for you.</p><p>Credentials:</p><ul><li><strong>Username:</strong> ${username}</li><li><strong>Password:</strong> ${password}</li></ul>` };
    await transporter.sendMail(mailOptions);
    const userResponse = { ...user.toObject() };
    delete userResponse.password;
    res.status(201).json(userResponse);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
router.delete('/users/:id', superAdminAuth, async (req, res) => {
  try {
    await ApprovalRequest.deleteMany({ $or: [{ requestedBy: req.params.id }, { targetUser: req.params.id }] });
    await Transaction.deleteMany({ $or: [{ sender: req.params.id }, { receiver: req.params.id }] });
    await Wallet.findOneAndDelete({ user: req.params.id });
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'User and all associated data deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
router.put('/users/:id/change-password', superAdminAuth, async (req, res) => {
    const { newPassword } = req.body;
    const userId = req.params.id;
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ msg: 'Please enter a password with 6 or more characters' });
    }
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        const mailOptions = { from: process.env.EMAIL_USER, to: user.email, subject: 'Your Password Has Been Changed', html: `<h1>Password Changed</h1><p>Hello ${user.fullName},</p><p>An administrator has changed the password for your account.</p><p>Your new password is: <strong>${newPassword}</strong></p>` };
        await transporter.sendMail(mailOptions);
        res.json({ msg: 'Password updated and notification sent successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
router.get('/pending-requests', superAdminAuth, async (req, res) => {
    try {
        const requests = await ApprovalRequest.find({ status: 'pending' }).populate('requestedBy', 'fullName').populate('targetUser', 'fullName');
        res.json(requests);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
router.post('/resolve-request/:id', superAdminAuth, async (req, res) => {
    const { action } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const request = await ApprovalRequest.findById(req.params.id).session(session);
        if (!request || request.status !== 'pending') throw new Error('Request not found or already resolved');
        if (action === 'approve') {
            const wallet = await Wallet.findOne({ user: request.targetUser }).session(session);
            wallet.balance += request.amount;
            await wallet.save({ session });
            const transaction = new Transaction({ sender: request.requestedBy, receiver: request.targetUser, amount: request.amount, type: request.amount > 0 ? 'credit' : 'debit' });
            await transaction.save({ session });
            request.status = 'approved';
        } else {
            request.status = 'rejected';
        }
        request.resolvedBy = req.user.id;
        await request.save({ session });
        await session.commitTransaction();
        res.json(request);
    } catch (err) {
        await session.abortTransaction();
        console.error(err.message);
        res.status(500).send('Server Error');
    } finally {
        session.endSession();
    }
});
router.get('/export/transactions', superAdminAuth, async (req, res) => {
    try {
        const { userId } = req.query;
        let queryFilter = {};
        let filename = 'all-transactions.csv';
        if (userId) {
            queryFilter = { $or: [{ sender: userId }, { receiver: userId }] };
            filename = `user_${userId}_transactions.csv`;
        }
        const transactions = await Transaction.find(queryFilter).populate('sender', 'fullName username').populate('receiver', 'fullName username').sort({ createdAt: 'desc' });
        const fields = [ { label: 'Date', value: 'createdAt' }, { label: 'Sender Name', value: 'sender.fullName' }, { label: 'Sender Username', value: 'sender.username' }, { label: 'Receiver Name', value: 'receiver.fullName' }, { label: 'Receiver Username', value: 'receiver.username' }, { label: 'Amount', value: 'amount' }, { label: 'Type', value: 'type' }, { label: 'Transaction ID', value: '_id' }, ];
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