require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_ORIGIN,
  }),
);
app.use(express.json());

const generateCrowdData = () => ({
  zoneA: Math.floor(Math.random() * 101),
  zoneB: Math.floor(Math.random() * 101),
  zoneC: Math.floor(Math.random() * 101),
});

app.get("/", (req, res) => {
  res.send("Backend is running...");
});

app.get("/api/crowd", (req, res) => {
  res.json(generateCrowdData());
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
