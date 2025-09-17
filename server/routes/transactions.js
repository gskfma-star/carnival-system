const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// @route   POST api/transactions/charge
// @desc    Charge a student for a purchase
// @access  Private (Vendor only)
router.post('/charge', auth, async (req, res) => {
  if (req.user.role !== 'Vendor') {
      return res.status(403).json({ msg: 'User is not a vendor' });
  }

  const { studentId, amount } = req.body;

  if (!studentId || !amount || amount <= 0) {
    return res.status(400).json({ msg: 'Invalid data provided' });
  }
  
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const vendorId = req.user.id;
    const studentWallet = await Wallet.findOne({ user: studentId }).session(session);
    const vendorWallet = await Wallet.findOne({ user: vendorId }).session(session);

    if (!studentWallet || !vendorWallet) {
      throw new Error('Wallet not found');
    }

    if (studentWallet.balance < amount) {
      return res.status(400).json({ msg: 'Insufficient balance' });
    }

    studentWallet.balance -= amount;
    vendorWallet.balance += amount;

    await studentWallet.save({ session });
    await vendorWallet.save({ session });

    const transaction = new Transaction({
      sender: studentId,
      receiver: vendorId,
      amount: amount,
      type: 'debit',
    });
    await transaction.save({ session });

    await session.commitTransaction();
    res.json({ msg: 'Transaction successful', newBalance: studentWallet.balance });

  } catch (err) {
    await session.abortTransaction();
    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    session.endSession();
  }
});

// @route   GET api/transactions/history
// @desc    Get user's transaction history
// @access  Private
router.get('/history', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const userTransactions = await Transaction.find({
            $or: [{ sender: userId }, { receiver: userId }]
        })
        .populate('sender', 'fullName')
        .populate('receiver', 'fullName')
        .sort({ createdAt: -1 }).limit(20);

        const history = userTransactions.map(tx => {
            const type = tx.sender._id.toString() === userId ? 'debit' : 'credit';
            const otherParty = type === 'debit' ? tx.receiver.fullName : tx.sender.fullName;

            return {
                _id: tx._id,
                amount: tx.amount,
                type: type,
                otherParty: otherParty,
                timestamp: tx.createdAt
            }
        });

        res.json(history);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;