
const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
    token: {type: String, required: true},
    userId: {type: mongoose.Schema.ObjectId, ref: 'User', required: true}
}, {timestamps: true});

module.exports = mongoose.model('Token', TokenSchema)