// middleware/mockAuth.js
// there's no real login system yet, so every request is treated as
// the one seed user in data.json. this gets replaced with real auth
// (JWT/session check) in a later module.
const db = require("../db");

function mockAuth(req, res, next) {
  const user = db.data.users.find((u) => u.id === "u1");

  if (!user) {
    return res.status(401).json({ error: "seed user not found" });
  }

  req.user = user;
  next();
}

module.exports = mockAuth;
