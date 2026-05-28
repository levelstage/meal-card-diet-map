const express = require('express');
const router = express.Router();
const config = require('../config_server');

// GET /api/nutrition?name=
// config_server.js의 MFDS_API_KEY로 식약처 외식 영양성분 API 호출
// 메뉴명으로 검색 → 검색된 모든 DB상 메뉴명, 칼로리, 탄수화물, 단백질, 지방 배열 반환

router.get('/', (req, res) => {
    const baseUrl = 'https://apis.data.go.kr/1471000/FoodNtrCpntDbInfo02';
    const SERVICE_KEY = config.MFDS_API_KEY;
    const queryParams = new URLSearchParams({
        serviceKey: SERVICE_KEY,
        pageNo: '1',
        numOfRows: '1000',
        type: 'json',
        FOOD_NM_KR: req.query.name

    });
    const targetUrl = `${baseUrl}?${queryParams.toString()}`;

    fetch(targetUrl)
    .then((response) =>{
        if(!response.ok){
            throw new Error(`HTTP Error: ${response.status}`);
        }
        return response.json();
    })
    .then((json) => {
        const rawItems = json.response?.body?.items;
        if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
            res.status(404).send("DATA NOT FOUND");
        }
        else {
            let result = rawItems.map((item) =>{
                return {
                    menuName: item['FOOD_NM_KR'],
                    energy: item['AMT_NUM1'],
                    carb: item['AMT_NUM6'],
                    prot: item['AMT_NUM3'],
                    fat: item['AMT_NUM4']
                };
            });
            res.json({menus: result});
        }
    })
    .catch((err) => {
        console.log(err);
        res.status(500).send('fetch failed');
    });
});

module.exports = router;
