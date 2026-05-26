const express = require('express');
const router = express.Router();

// GET /api/nutrition?name=
// config_server.js의 MFDS_API_KEY로 식약처 외식 영양성분 API 호출
// 메뉴명으로 검색 → 칼로리, 탄수화물, 단백질, 지방 등 반환

module.exports = router;
