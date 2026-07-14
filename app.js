// app.js
// express setup, mounts every router.
const express = require("express");
const app = express();

app.use(express.json());

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const documentRoutes = require("./routes/documents");
const templateRoutes = require("./routes/templates");
const aiRoutes = require("./routes/ai");
const applicationRoutes = require("./routes/applications");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/applications", applicationRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`resume-api running at http://localhost:${PORT}`);
});

module.exports = app;
