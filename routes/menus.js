const express = require('express');
const router = express.Router();

// GET /api/menus?storeId=
// db/init.js의 DB 인스턴스로 menus 테이블에서 해당 가맹점 메뉴 조회 후 반환

// POST /api/menus
// body: { storeId, name }
// menus 테이블에 새 메뉴 삽입 (크라우드소싱)

module.exports = router;
