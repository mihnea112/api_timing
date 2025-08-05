import express from "express";
import cors from 'cors';
import bodyParser from "body-parser";
import { db } from "./db.ts";

const app = express();

app.use(cors()); 
const PORT = 3001;

app.use(bodyParser.json());

// POST /api/time - Create new time
app.post("/api/time", async (req, res) => {
  const { time_ms } = req.body;
  if (typeof time_ms !== "number") {
    return res.status(400).json({ error: "Missing or invalid time_ms" });
  }

  try {
    const [result]: any = await db.execute(
      "INSERT INTO time_logs (time_ms) VALUES (?)",
      [time_ms]
    );
    const insertId = result.insertId;

    res.status(201).json({ message: "Time saved", id: insertId });
  } catch (err) {
    res.status(500).json({ error: "DB insert failed" });
  }
});

// PATCH /api/time/:id/car - Set car number
app.patch("/api/time/:id/car_number", async (req, res) => {
  const { id } = req.params;
  const { car_number } = req.body;

  if (typeof car_number !== "number") {
    return res.status(400).json({ error: "Invalid car_number" });
  }

  try {
    await db.execute("UPDATE time_logs SET car_number = ? WHERE id = ?", [
      car_number,
      id,
    ]);
    res.json({ message: "Car number updated" });
  } catch (err) {
    res.status(500).json({ error: "DB update failed" });
  }
});

// PATCH /api/time/:id/penalty - Set penalty
app.patch("/api/time/:id/penalty_ms", async (req, res) => {
  const { id } = req.params;
  const { penalty_ms } = req.body;

  if (typeof penalty_ms !== "number") {
    return res.status(400).json({ error: "Invalid penalty_ms" });
  }

  try {
    await db.execute("UPDATE time_logs SET penalty_ms = ? WHERE id = ?", [
      penalty_ms,
      id,
    ]);
    res.json({ message: "Penalty updated" });
  } catch (err) {
    res.status(500).json({ error: "DB update failed" });
  }
});
app.patch('/api/time/:id/stage', async (req, res) => {
  const { id } = req.params;
  const { stage } = req.body;

  if (typeof stage !== 'number' || stage < 1 || stage > 2) {
    return res.status(400).json({ error: 'Invalid stage number. Must be 1 or 2.' });
  }

  try {
    const [result] = await db.query('UPDATE time_logs SET stage = ? WHERE id = ?', [stage, id]);
    
    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: 'Time entry not found.' });
    }

    res.status(200).json({ message: 'Stage updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error.' });
  }
});

app.get("/api/times", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM time_logs ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB read error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API server running at http://localhost:${PORT}`);
});
