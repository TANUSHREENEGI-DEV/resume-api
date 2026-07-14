// db.js
// tiny "database" for the AI Resume Builder api.
// reads data.json into memory on start, every route mutates this object,
// and every change gets written back to disk right away.
const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data.json");

function load() {
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

// in-memory copy, loaded once when the server starts
let data = load();

function save() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// simple id generator, good enough for a mock backend without a real db
function makeId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

module.exports = {
  get data() {
    return data;
  },
  save,
  makeId
};
