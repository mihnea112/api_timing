import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

export const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

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

// PATCH /api/time/:id/racer - Set racer_id
app.patch("/api/time/:id/racer", async (req, res) => {
  const { id } = req.params;
  const { racer_id } = req.body;

  if (typeof racer_id !== "number") {
    return res.status(400).json({ error: "Invalid racer_id" });
  }

  try {
    await db.execute("UPDATE time_logs SET racer_id = ? WHERE id = ?", [
      racer_id,
      id,
    ]);
    res.json({ message: "Racer updated" });
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
app.patch("/api/time/:id/stage", async (req, res) => {
  const { id } = req.params;
  const { stage } = req.body;

  if (typeof stage !== "number" || stage < 1 || stage > 2) {
    return res
      .status(400)
      .json({ error: "Invalid stage number. Must be 1 or 2." });
  }

  try {
    const [result] = await db.query(
      "UPDATE time_logs SET stage = ? WHERE id = ?",
      [stage, id]
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: "Time entry not found." });
    }

    res.status(200).json({ message: "Stage updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error." });
  }
});

app.get("/api/times", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT t.*, r.name AS racer_name, r.car_number, r.category
       FROM time_logs t
       LEFT JOIN racers r ON t.racer_id = r.id
       ORDER BY t.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB read error" });
  }
});
app.get("/api/racers", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM racers ORDER BY category, car_number"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB read error" });
  }
});

// POST /api/racers - add new racer
app.post("/api/racers", async (req, res) => {
  const { name, car_number, category } = req.body;
  if (!name || !car_number || !category) {
    return res.status(400).json({ error: "Missing fields" });

  }

  try {
    const [result]: any = await db.execute(
      "INSERT INTO racers (name, car_number, category) VALUES (?, ?, ?)",
      [name, car_number, category]
    );
    res.status(201).json({ id: result.insertId, name, car_number, category });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB insert failed" });
  }
});

// DELETE /api/racers/:id - remove racer
app.delete("/api/racers/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result]: any = await db.execute("DELETE FROM racers WHERE id = ?", [
      id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Racer not found" });
    }
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB delete failed" });
  }
});

// (optional) PUT /api/racers/:id - update racer info
app.put("/api/racers/:id", async (req, res) => {
  const { id } = req.params;
  const { name, carNumber, category } = req.body;
  try {
    const [result]: any = await db.execute(
      "UPDATE racers SET name = ?, car_number = ?, category = ? WHERE id = ?",
      [name, carNumber, category, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Racer not found" });
    }
    res.json({ id, name, carNumber, category });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB update failed" });
  }
});

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log("Server started on port " + port);
});

export default app;
