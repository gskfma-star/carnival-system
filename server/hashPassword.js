const bcrypt = require('bcryptjs');

// Get the password from the command line argument
const password = process.argv[2];

if (!password) {
  console.log('Error: Please provide a password to hash.');
  console.log('Usage: node hashPassword.js <your-password-here>');
  process.exit(1);
}

const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);

console.log('Your secure hashed password is:');
console.log(hash);