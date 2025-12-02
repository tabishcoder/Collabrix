
const User = require('../models/User')

// @desc get my own profile
// @route /api/users/me
// @access Private
// @method GET
module.exports.getMe = async (req, res) => {
    const user = await User.findById(req.user._id).select('-passwordHash');
    res.json(user);
}