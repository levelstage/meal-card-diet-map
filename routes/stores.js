const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');

const db = new Database('stores.db');

const config = require('../config_server');

function checkDataExists() {
    try {
        // 테이블이 존재하고 데이터가 1개 이상 있는지 확인
        const row = db.prepare("SELECT COUNT(*) AS total FROM stores").get();
        return row && row.total > 0;
    } catch (err) {
        // 테이블이 아직 생성되지 않았거나(Reload 전) 에러가 나면 false 반환
        return false;
    }
}

// [GET] 현재 지도 중심 좌표 기준 주변 가게 id 목록을 json으로 반환 반환
// 요청 주소 예시: GET /api/stores?lat=37.5665&lng=126.9780
// 값 참조 예시: fetch( ... return response.json})
//             .then((json) => { ... let store = json.nearbyStores[0] ... } ) ...

router.get('/', (req, res) => {
    if(!checkDataExists()){
        return res.status(503).json({ error: '서버가 초기 데이터를 로딩 중입니다. 잠시 후 다시 시도해주세요.' });
    }

    const currentLat = parseFloat(req.query.lat);
    const currentLng = parseFloat(req.query.lng);

    if (isNaN(currentLat) || isNaN(currentLng)){
        return res.status(400).json({ error: 'invalid lat or lng' });
    }

    // 약 반경 1km 내외 사각형 범위 오차값
    const latOffset = 0.009;
    const lngOffset = 0.011;

    const minLat = currentLat - latOffset;
    const maxLat = currentLat + latOffset;
    const minLng = currentLng - lngOffset;
    const maxLng = currentLng + lngOffset;

    try{
        const stmt = db.prepare(`
                SELECT * FROM stores 
                WHERE latitude >= ? AND latitude <= ? 
                  AND longitude >= ? AND longitude <= ?
            `);
        const nearbyStores = stmt.all(minLat, maxLat, minLng, maxLng);
        res.json({nearbyStores: nearbyStores});
    }
    catch (err)
    {
        console.error("error in filtering: ", err.message);
        res.status(500).json({ error: '데이터 조회 중 오류' });
    }
});

// [GET] id => 해당 id의 가게 상세 정보
// 요청 주소 예시: /api/stores/연세식당_서울시서대문구연세로50
// 값 참조 예시: fetch( ... return response.json})
//             .then((json) => { ... let storeName = json.storeDetail.mrhstNm; ... } ) ...


router.get('/:id', (req, res) => {
    if(!checkDataExists()){
        return res.status(503).json({ error : '서버가 초기 데이터를 로딩 중입니다. 잠시 후 다시 시도해주세요.' });
    }
    const targetId = req.params.id;
    const stmt = db.prepare('SELECT * FROM stores WHERE id = ?');
    const storeDetail = stmt.get(targetId);
    if(!storeDetail){
        return res.status(404).json({ error: '유효하지 않은 가맹점입니다.'});
    }
    res.json({storeDetail: storeDetail});
});


module.exports = router;
