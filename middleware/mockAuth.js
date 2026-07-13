// middleware/mockAuth.js
// we don't have real login yet (that's a later module), so every request
// is treated as the one seed user in data.json. this lets routes like
// GET /api/users/me or GET /api/documents work straight from the browser
// without needing a real Authorization header.

const db = require("../db");

function mockAuth(req, res, next) {
  const user = db.data.users[0];
  if (!user) {
    return res.status(401).json({ error: "no authenticated user" });
  }
  req.user = user;
  next();
}

module.exports = mockAuth;
