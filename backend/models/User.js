const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  avatar: { type: String },
  isVerified: { type: Boolean, default: false },

  /** Platform operator (Collabrix staff). Not workspace owner/admin. */
  platformRole: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    index: true,
  },

  // for password and email verification
  meta: {
    resendCount: { type: Number, default: 0 },
    lastSentAt: Date,
    hourWindowStart: Date
  }
}, { timestamps: true });

// Pre-save hook to hash accessCode if changed/new
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Method to compare passwords
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

module.exports = mongoose.model('User', UserSchema);
