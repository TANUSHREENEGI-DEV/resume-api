// app.js
const express = require("express");
const logger = require("./middleware/logger");
const routes = require("./routes");

const app = express();

// Middleware: runs before every route
app.use(express.json());
app.use(logger);

// All our routes live under /api
app.use("/api", routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`resume-api running at http://localhost:${PORT}`);
});

module.exports = app;
