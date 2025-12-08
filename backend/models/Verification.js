
const mongoose = require("mongoose");

const verificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    otpHash: { type: String, required: true },
    type: { type: String, enum: ["email_verification", "password_reset"], required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
}, {
    timestamps: true
});

// Auto-delete after expiration
verificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Verification", verificationSchema);
