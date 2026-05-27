const express = require('express');
const router = express.Router();

const config = require('../config_server');

let store_cache = [];
let isDataLoaded = false;

function loadStoresToCache() {
    console.log("전국아동복지급식정보 API 요청 및 캐시 적재 중...");
    
    // API fetch용 URL 조립
    const baseUrl = "https://api.data.go.kr/openapi/tn_pubr_public_chil_wlfare_mlsv_api";
    const SERVICE_KEY = config.PUBLIC_DATA_API_KEY;

    const queryParams = new URLSearchParams({
        serviceKey: SERVICE_KEY,
        pageNo: '1',
        numOfRows: '1000',
        type: 'json'
    });

    const targetUrl = `${baseUrl}?${queryParams.toString()}`;

    // 조립 완료한 URL 발사
    fetch(targetUrl)
    .then((response) => {
        if(!response.ok){
            throw new Error(`HTTP Error: ${response.status}`);
        }
        return response.json();
    })
    .then((json) => {
        const rawItems = json.response.body.items;
        // 데이터에 고유 식별용 키가 없으므로 강제로 부여
        // 로드될때마다 변경되지 않도록 도로명주소 + 상호명으로 고정
        store_cache = rawItems.map((store, index) => {
            const trimmedName = store.mrhstNm.replace(/\s/g, '');
            const trimmedAddress = store.rdnmadr.replace(/\s/g, '');
            return {
                id: `${trimmedName}_${trimmedAddress}`,
                ...store
            }
        });

        isDataLoaded = true;
        console.log("캐싱 성공.");
    })
    .catch((err) => {
        console.error(err.message);
    });
}
loadStoresToCache();

// [GET] 현재 지도 중심 좌표 기준 주변 가게 id 목록을 json으로 반환 반환
// 요청 주소 예시: GET /api/stores?lat=37.5665&lng=126.9780
// 값 참조 예시: fetch( ... return response.json})
//             .then((json) => { ... let store = json.nearbyStores[0] ... } ) ...

router.get('/', (req, res) => {
    if(!isDataLoaded){
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

    try{
        const nearbyStores = store_cache.filter(store => {
            const storeLat = parseFloat(store.latitude);
            const storeLng = parseFloat(store.longitude);

            if (isNaN(storeLat) || isNaN(storeLng)) return false;

            return storeLat >= currentLat - latOffset &&
                   storeLat <= currentLat + latOffset &&
                   storeLng >= currentLng - lngOffset &&
                   storeLng <= currentLng + lngOffset;
        });

        res.json(nearbyStores);
    }
    catch (err)
    {
        console.error("error in filtering: ", err.message);
        res.status(500).json({ error: '데이터 처리 중 오류' });
    }
});

// [GET] id => 해당 id의 가게 상세 정보
// 요청 주소 예시: /api/stores/연세식당_서울시서대문구연세로50
// 값 참조 예시: fetch( ... return response.json})
//             .then((json) => { ... let storeName = json.storeDetail.mrhstNm; ... } ) ...


router.get('/:id', (req, res) => {
    if(!isDataLoaded){
        return res.status(503).json({ error : '서버가 초기 데이터를 로딩 중입니다. 잠시 후 다시 시도해주세요.' });
    }
    const targetId = req.params.id;
    const storeDetail = store_cache.find(store => store.id === targetId);
    if(!storeDetail){
        return res.status(404).json({ error: '유효하지 않은 가맹점입니다.'});
    }
    res.json(storeDetail);
});


module.exports = router;
