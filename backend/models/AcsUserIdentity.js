const mongoose = require('mongoose');

const AcsUserIdentitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    communicationUserId: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AcsUserIdentity', AcsUserIdentitySchema);
