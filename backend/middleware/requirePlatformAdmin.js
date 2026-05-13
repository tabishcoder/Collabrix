/**
 * @deprecated Use requireRole(['admin']) from requireRole.js
 */
const requireRole = require('./requireRole');
module.exports = requireRole(['admin']);
