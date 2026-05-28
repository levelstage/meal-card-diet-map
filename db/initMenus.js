const Database = require('better-sqlite3');
const db = new Database('menus.db');

db.exec(`
    CREATE TABLE IF NOT EXISTS menus (
    storeId   TEXT,
    menuName  TEXT,
    energy REAL,
    carb REAL,
    prot REAL,
    fat REAL,
    PRIMARY KEY (storeId, menuName)
    );
`);