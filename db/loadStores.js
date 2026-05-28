const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const config = require('../config_server');

const db = new Database('stores.db', { verbose: console.log });

function appendStoresToDB(stores)
{
    const insertion = db.transaction((items)=>{
        const insertStmt = db.prepare(`
            INSERT OR REPLACE INTO stores (
                id, mrhstNm, mrhstCode, ctprvn, signguNm, signguCode, 
                rdnmadr, lnmadr, latitude, longitude, phoneNumber, 
                weekdayOperOpenHhmm, WeekdayOperCloseHhmm, satOperOpenHhmm, satOperCloseHhmm, 
                holidayOperOpenHhmm, holidayCloseOpenHhmm, dlvrOperOpenHhmm, dlvrCloseOpenHhmm, 
                institutionNm, institutionPhoneNumber, referenceDate, instt_code
            ) VALUES (
                :id, :mrhstNm, :mrhstCode, :ctprvn, :signguNm, :signguCode, 
                :rdnmadr, :lnmadr, :latitude, :longitude, :phoneNumber, 
                :weekdayOperOpenHhmm, :WeekdayOperCloseHhmm, :satOperOpenHhmm, :satOperCloseHhmm, 
                :holidayOperOpenHhmm, :holidayCloseOpenHhmm, :dlvrOperOpenHhmm, :dlvrCloseOpenHhmm, 
                :institutionNm, :institutionPhoneNumber, :referenceDate, :instt_code
            )
        `);
        for(const item of items)
        {
            insertStmt.run(item);
        }
    });

    try{
        insertion(stores);
    }
    catch(err){
        console.error('DB 적재 중 오류: ', err.message);
        throw err;
    }
}

function loadStoresFrom(page) {
    
    // API fetch용 URL 조립
    const baseUrl = "https://api.data.go.kr/openapi/tn_pubr_public_chil_wlfare_mlsv_api";
    const SERVICE_KEY = config.PUBLIC_DATA_API_KEY;

    const queryParams = new URLSearchParams({
        serviceKey: SERVICE_KEY,
        pageNo: String(page),
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
        let storeCache = [];
        const rawItems = json.response?.body?.items;

        if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
                console.log(`데이터 총 ${page-1}페이지 적재 완료.`);
                return;
        }

        if (rawItems && Array.isArray(rawItems)) {
            // 데이터에 고유 식별용 키가 없으므로 강제로 부여
            // 로드될때마다 변경되지 않도록 도로명주소 + 상호명으로 고정
            storeCache = rawItems.map((store, index) => {
            const mrhstName = store['가맹점명'] || '';
            const rdnmAddress = store['소재지도로명주소'] || '';
            const trimmedName = mrhstName.replace(/\s/g, '');
            const trimmedAddress = rdnmAddress.replace(/\s/g, '');

            return {
                // 공공데이터 포털의 규격을 그대로 쓰지만,
                // weekdayOperColseHhmm -> weekdayOperCloseHhmm
                // satOperOperOpenHhmm -> satOperOpenHhmm
                // 다음과 같이 포털 상 오타는 수정했습니다.
                id: `${trimmedName}_${trimmedAddress}`,
                mrhstNm: store['가맹점명'],
                mrhstCode: store['가맹점유형코드'],
                ctprvn: store['시도명'],
                signguNm: store['시군구명'],
                signguCode: store['시군구코드'],
                rdnmadr: store['소재지도로명주소'],
                lnmadr: store['소재지지번주소'],
                latitude: store['위도'] ? Number(store['위도']) : null,
                longitude: store['경도'] ? Number(store['경도']) : null,
                phoneNumber: store['전화번호'],
                weekdayOperOpenHhmm: store['평일운영시작시각'],
                WeekdayOperCloseHhmm: store['평일운영종료시각'],
                satOperOpenHhmm: store['토요일운영시작시각'],
                satOperCloseHhmm: store['토요일운영종료시각'],
                holidayOperOpenHhmm: store['공휴일운영시작시각'],
                holidayCloseOpenHhmm: store['공휴일운영종료시각'],
                dlvrOperOpenHhmm: store['배달시작시각'],
                dlvrCloseOpenHhmm: store['배달종료시각'],
                institutionNm: store['관리기관명'],
                institutionPhoneNumber: store['관리기관전화번호'],
                referenceDate: store['데이터기준일자'],
                instt_code: store['제공기관코드']
            };
        });

        console.log(`${String(page)} page 적재 성공.`);
        }
        appendStoresToDB(storeCache);
        loadStoresFrom(page+1)
    })
    .catch((err) => {
        console.error(err.message);
    });
}

router.get('/Reload', (req, res) => {
    // 기존 테이블 삭제 후 새로운 테이블 생성
    try{
        db.exec(`
            DROP TABLE IF EXISTS stores;
            
            CREATE TABLE stores(
                id TEXT PRIMARY KEY,
                mrhstNm TEXT,
                mrhstCode TEXT,
                ctprvn TEXT,
                signguNm TEXT,
                signguCode TEXT,
                rdnmadr TEXT,
                lnmadr TEXT,
                latitude REAL,
                longitude REAL,
                phoneNumber TEXT,
                weekdayOperOpenHhmm TEXT,
                WeekdayOperCloseHhmm TEXT,
                satOperOpenHhmm TEXT,
                satOperCloseHhmm TEXT,
                holidayOperOpenHhmm TEXT,
                holidayCloseOpenHhmm TEXT,
                dlvrOperOpenHhmm TEXT,
                dlvrCloseOpenHhmm TEXT,
                institutionNm TEXT,
                institutionPhoneNumber TEXT,
                referenceDate TEXT,
                instt_code TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_stores_coords ON stores (latitude, longitude);
        `);
        loadStoresFrom(1);
        res.status(200).json({ success: true, message: "초기화 후 전체 수집을 시작했습니다." });
    }
    catch(err)
    {
        console.error(err);
        res.status(500).send("Reload 중 error 발생");
    }
});

router.get('/LoadFrom', (req, res) => {
    try {
        // 쿼리스트링에서 ?pageNo=값 가져오기 (기본값 1)
        const targetPage = Number(req.query.pageNo) || 1;
        
        // 수집 시작
        loadStoresFrom(targetPage);
        
        // 백그라운드 작업 시작 응답
        res.status(200).json({ 
            success: true, 
            message: `${targetPage} 페이지부터 수집을 시작했습니다.` 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("LoadFrom 중 에러 발생");
    }
});

router.get('/PageCount', (req, res)=>{
    try {
        // COUNT(*) 구문에 AS total 별칭 부여 및 응답 매핑
        const result = db.prepare('SELECT COUNT(*) AS total FROM stores;').get();
        res.json({ pageCount: result.total / 1000});
    } catch (err) {
        console.error(err);
        res.status(500).send("행 개수 조회 실패");
    }
});

module.exports = router;