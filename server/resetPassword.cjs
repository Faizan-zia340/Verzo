require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function resetPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.log('Usage: node resetPassword.js <email> <newPassword>');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
  const hashed = await bcrypt.hash(newPassword, 12);

  const result = await User.updateOne(
    { email: email },
    { $set: { password: hashed } }
  );

  if (result.matchedCount === 0) {
    console.log(`No user found with email: ${email}`);
  } else {
    console.log(`Password updated successfully for ${email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

resetPassword().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
