const Database = require('better-sqlite3');
const db = new Database('stores.db');

db.exec(`
    CREATE TABLE IF NOT EXISTS menus (
    storeId   TEXT,
    menuName TEXT PRIMARY KEY,
    energy INT, 
    carb INT,
    prot INT,
    fat INT,
    PRIMARY KEY (storeId, menuName)
    );
`);