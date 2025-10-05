import dotenv from "dotenv";
import express from "express";
import axios from "axios";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());

const TRELLO_KEY = process.env.TRELLO_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
const MEMBER_ID = "68dcbbf686582c853dd25c18";  // ✅ From your data
const BOARD_ID = "68e20dd5c636e8634f1119ab";   // ✅ Your first board

// ✅ Route to get all boards of the user
app.get("/api/boards", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.trello.com/1/members/${MEMBER_ID}/boards?key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch boards" });
  }
});

// ✅ Route to get specific board details
app.get("/api/board", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.trello.com/1/boards/${BOARD_ID}?key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch board" });
  }
});

// ✅ Route to get lists (To Do / In Progress / Done)
app.get("/api/board/lists", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.trello.com/1/boards/${BOARD_ID}/lists?key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch board lists" });
  }
});

// ✅ Route to get cards of a board
app.get("/api/board/cards", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.trello.com/1/boards/${BOARD_ID}/cards?key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch board cards" });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
