
const User = require('../models/User')

// @desc get my own profile
// @route /api/users/me
// @access Private
// @method GET
module.exports.getMe = async (req, res) => {
    // already secured, user set by middleware
    res.json(req.user);
}