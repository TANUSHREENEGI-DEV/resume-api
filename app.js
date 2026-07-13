// app.js
// resume-api - backend for the AI Resume Builder
// one Express server, clean route files, data persisted to data.json
// (no real database yet - that's next module)

const express = require("express");
const app = express();

app.use(express.json());

const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const documentsRoutes = require("./routes/documents");
const templatesRoutes = require("./routes/templates");
const aiRoutes = require("./routes/ai");
const applicationsRoutes = require("./routes/applications");

app.get("/", (req, res) => {
  res.status(200).json({ message: "resume-api is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/templates", templatesRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/applications", applicationsRoutes);

// unknown route
app.use((req, res) => {
  res.status(404).json({ error: "route not found" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`resume-api running on http://localhost:${PORT}`);
});
