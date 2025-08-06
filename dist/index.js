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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const db_ts_1 = require("./db.ts");
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
        const [result] = yield db_ts_1.db.execute("INSERT INTO time_logs (time_ms) VALUES (?)", [time_ms]);
        const insertId = result.insertId;
        res.status(201).json({ message: "Time saved", id: insertId });
    }
    catch (err) {
        res.status(500).json({ error: "DB insert failed" });
    }
}));
// PATCH /api/time/:id/car - Set car number
app.patch("/api/time/:id/car_number", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { car_number } = req.body;
    if (typeof car_number !== "number") {
        return res.status(400).json({ error: "Invalid car_number" });
    }
    try {
        yield db_ts_1.db.execute("UPDATE time_logs SET car_number = ? WHERE id = ?", [
            car_number,
            id,
        ]);
        res.json({ message: "Car number updated" });
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
        yield db_ts_1.db.execute("UPDATE time_logs SET penalty_ms = ? WHERE id = ?", [
            penalty_ms,
            id,
        ]);
        res.json({ message: "Penalty updated" });
    }
    catch (err) {
        res.status(500).json({ error: "DB update failed" });
    }
}));
app.patch('/api/time/:id/stage', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { stage } = req.body;
    if (typeof stage !== 'number' || stage < 1 || stage > 2) {
        return res.status(400).json({ error: 'Invalid stage number. Must be 1 or 2.' });
    }
    try {
        const [result] = yield db_ts_1.db.query('UPDATE time_logs SET stage = ? WHERE id = ?', [stage, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Time entry not found.' });
        }
        res.status(200).json({ message: 'Stage updated successfully.' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error.' });
    }
}));
app.get("/api/times", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [rows] = yield db_ts_1.db.execute("SELECT * FROM time_logs ORDER BY created_at DESC");
        res.json(rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "DB read error" });
    }
}));
app.listen(PORT, () => {
    console.log(`🚀 API server running at http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map