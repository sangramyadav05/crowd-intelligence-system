require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
let previousCrowdData = null;

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
  },
});

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

const predictCrowdData = (currentData, previousData) => {
  if (!previousData) {
    return currentData;
  }

  return Object.fromEntries(
    Object.entries(currentData).map(([zone, currentValue]) => {
      const previousValue = previousData[zone] ?? currentValue;
      const difference = currentValue - previousValue;
      const predictedValue = Math.max(0, currentValue + difference);

      return [zone, predictedValue];
    }),
  );
};

const generateActions = (predictedData) =>
  Object.fromEntries(
    Object.entries(predictedData).map(([zone, predictedValue]) => {
      if (predictedValue > 80) {
        return [zone, "Restrict entry and redirect crowd"];
      }

      if (predictedValue > 60) {
        return [zone, "Prepare to redirect crowd"];
      }

      return [zone, "Safe"];
    }),
  );

const buildCrowdPayload = () => {
  const currentCrowdData = generateCrowdData();
  const predictedCrowdData = predictCrowdData(currentCrowdData, previousCrowdData);
  const actions = generateActions(predictedCrowdData);

  previousCrowdData = currentCrowdData;

  return {
    current: currentCrowdData,
    predicted: predictedCrowdData,
    actions,
  };
};

app.get("/", (req, res) => {
  res.send("Backend is running...");
});

app.get("/api/crowd", (req, res) => {
  res.json(buildCrowdPayload());
});

io.on("connection", (socket) => {
  socket.emit("crowd:update", buildCrowdPayload());
});

setInterval(() => {
  io.emit("crowd:update", buildCrowdPayload());
}, 2000);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
