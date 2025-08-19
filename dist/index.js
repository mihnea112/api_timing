"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.db = promise_1.default.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const PORT = 3001;
app.use(body_parser_1.default.json());
// POST /api/time - Create new time
app.post("/api/time", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { time_ms } = req.body;
    if (typeof time_ms !== "number") {
        return res.status(400).json({ error: "Missing or invalid time_ms" });
    }
    try {
        const [result] = yield exports.db.execute("INSERT INTO time_logs (time_ms) VALUES (?)", [time_ms]);
        const insertId = result.insertId;
        res.status(201).json({ message: "Time saved", id: insertId });
    }
    catch (err) {
        res.status(500).json({ error: "DB insert failed" });
    }
}));
// PATCH /api/time/:id/racer - Set racer_id
app.patch("/api/time/:id/racer", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { racer_id } = req.body;
    if (typeof racer_id !== "number") {
        return res.status(400).json({ error: "Invalid racer_id" });
    }
    try {
        yield exports.db.execute("UPDATE time_logs SET racer_id = ? WHERE id = ?", [
            racer_id,
            id,
        ]);
        res.json({ message: "Racer updated" });
    }
    catch (err) {
        res.status(500).json({ error: "DB update failed" });
    }
}));
// PATCH /api/time/:id/penalty - Set penalty
app.patch("/api/time/:id/penalty_ms", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { penalty_ms } = req.body;
    if (typeof penalty_ms !== "number") {
        return res.status(400).json({ error: "Invalid penalty_ms" });
    }
    try {
        yield exports.db.execute("UPDATE time_logs SET penalty_ms = ? WHERE id = ?", [
            penalty_ms,
            id,
        ]);
        res.json({ message: "Penalty updated" });
    }
    catch (err) {
        res.status(500).json({ error: "DB update failed" });
    }
}));
app.patch("/api/time/:id/stage", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { stage } = req.body;
    if (typeof stage !== "number" || stage < 1 || stage > 2) {
        return res
            .status(400)
            .json({ error: "Invalid stage number. Must be 1 or 2." });
    }
    try {
        const [result] = yield exports.db.query("UPDATE time_logs SET stage = ? WHERE id = ?", [stage, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Time entry not found." });
        }
        res.status(200).json({ message: "Stage updated successfully." });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error." });
    }
}));
// PATCH /api/time/:id/abandon - Abandon a stage (set time_ms = 540000)
app.patch("/api/time/:id/abandon", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { stage } = req.body;
    if (typeof stage !== "number" || (stage !== 1 && stage !== 2)) {
        return res
            .status(400)
            .json({ error: "Invalid stage number. Must be 1 or 2." });
    }
    try {
        // Set time_ms to 540000 for this time log and stage.
        const [result] = yield exports.db.query("UPDATE time_logs SET time_ms = 540000 WHERE id = ? AND stage = ?", [id, stage]);
        if (result.affectedRows === 0) {
            return res
                .status(404)
                .json({ error: "Time entry not found for given id and stage." });
        }
        res
            .status(200)
            .json({ message: "Stage abandoned. Time set to 540000 ms." });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error." });
    }
}));
app.patch("/api/racers/:racerId/abandon", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { racerId } = req.params;
    const { stage } = req.body;
    if (typeof stage !== "number" || (stage !== 1 && stage !== 2)) {
        return res.status(400).json({ error: "Invalid stage number. Must be 1 or 2." });
    }
    try {
        const [result] = yield exports.db.query("UPDATE time_logs SET time_ms = 540000 WHERE racer_id = ? AND stage = ?", [racerId, stage]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "No matching time log found for racer and stage." });
        }
        res.status(200).json({ message: "Stage abandoned for racer. Time set to 540000 ms." });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error." });
    }
}));
app.get("/api/times", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [rows] = yield exports.db.execute(`SELECT t.*, r.name AS racer_name, r.car_number, r.category
       FROM time_logs t
       LEFT JOIN racers r ON t.racer_id = r.id
       ORDER BY t.created_at DESC`);
        res.json(rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "DB read error" });
    }
}));
app.get("/api/racers", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [rows] = yield exports.db.execute("SELECT * FROM racers ORDER BY category, car_number");
        res.json(rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "DB read error" });
    }
}));
// POST /api/racers - add new racer
app.post("/api/racers", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, car_number, category } = req.body;
    if (!name || !car_number || !category) {
        return res.status(400).json({ error: "Missing fields" });
    }
    try {
        const [result] = yield exports.db.execute("INSERT INTO racers (name, car_number, category) VALUES (?, ?, ?)", [name, car_number, category]);
        res.status(201).json({ id: result.insertId, name, car_number, category });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "DB insert failed" });
    }
}));
// DELETE /api/racers/:id - remove racer
app.delete("/api/racers/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const [result] = yield exports.db.execute("DELETE FROM racers WHERE id = ?", [
            id,
        ]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Racer not found" });
        }
        res.sendStatus(204);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "DB delete failed" });
    }
}));
// (optional) PUT /api/racers/:id - update racer info
app.put("/api/racers/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name, carNumber, category } = req.body;
    try {
        const [result] = yield exports.db.execute("UPDATE racers SET name = ?, car_number = ?, category = ? WHERE id = ?", [name, carNumber, category, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Racer not found" });
        }
        res.json({ id, name, carNumber, category });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "DB update failed" });
    }
}));
const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log("Server started on port " + port);
});
exports.default = app;
//# sourceMappingURL=index.js.map