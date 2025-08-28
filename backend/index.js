import express from "express";
import cors from "cors";
import simulateApi from "./simulateTransactionApi.js";

const app = express();

app.use(cors());


// Middleware to parse JSON
app.use(express.json());

// Basic test route
app.get("/", (req, res) => {
    res.send("Hello from CRUD App Backend!");
});

app.use("/simulateTransaction", simulateApi);

// Server listen
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
