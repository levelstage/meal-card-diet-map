const express = require('express');
const router = express.Router();

// GET /api/stores?lat=&lng=
// config_server.js의 PUBLIC_DATA_API_KEY로 공공데이터포털 아동급식카드 가맹점 API 호출
// 좌표 기반으로 주변 가맹점 필터링 후 JSON 반환

module.exports = router;
