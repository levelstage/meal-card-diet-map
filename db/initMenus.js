const Database = require('better-sqlite3');
const db = new Database('menus.db');

db.exec(`
    CREATE TABLE IF NOT EXISTS menus (
    storeId   TEXT,
    menuName  TEXT,
    energy INT,
    carb INT,
    prot INT,
    fat INT,
    PRIMARY KEY (storeId, menuName)
    );
`);