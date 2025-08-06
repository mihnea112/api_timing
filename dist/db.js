"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
exports.db = promise_1.default.createPool({
    host: 'sql.freedb.tech',
    port: 3306,
    user: 'freedb_mihnea',
    password: 'FPvSGu!UqG6mryj',
    database: 'freedb_timing',
});
//# sourceMappingURL=db.js.map