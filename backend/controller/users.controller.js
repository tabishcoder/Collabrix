
const User = require('../models/User')

// @desc get my own profile
// @route /api/users/me
// @access Private
// @method GET
module.exports.getMe = async (req, res) => {
    // already secured, user set by middleware
    // send only required fields
    const userDTO = {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role || 'member',
        isActive: req.user.isActive !== false,
    }
    res.json(userDTO);
}