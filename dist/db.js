import mysql from 'mysql2/promise';
export const db = mysql.createPool({
    host: 'sql.freedb.tech',
    port: 3306,
    user: 'freedb_mihnea',
    password: 'FPvSGu!UqG6mryj',
    database: 'freedb_timing',
});
//# sourceMappingURL=db.js.map