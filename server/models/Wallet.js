// server/models/Wallet.js
const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
  // This creates a reference to a document in the 'User' collection.
  user: {
    type: mongoose.Schema.Types.ObjectId, // The type is an ObjectId
    ref: 'User',                         // The model to use for the reference is 'User'
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    required: true,
    default: 0
  }
}, { timestamps: true });

// Only define the 'Wallet' model here. Do NOT define the 'User' model again.
module.exports = mongoose.model('Wallet', WalletSchema);