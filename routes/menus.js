const express = require('express');
const router = express.Router();

const Database = require('better-sqlite3');
const db = new Database('menus.db');

// GET /api/menus?storeId=
// db/init.js의 DB 인스턴스로 menus 테이블에서 해당 가맹점 메뉴 조회 후 반환
/* menus 예시 (객체의 배열 형태)
{
  "menus": [
    {
      "storeId": "store_123",
      "menuName": "제육덮밥",
      "energy": 700,
      "carb": 80,
      "prot": 30,
      "fat": 20
    },
    {
      "storeId": "store_123",
      "menuName": "김치찌개",
      "energy": 450,
      "carb": 40,
      "prot": 25,
      "fat": 15
    }
  ]
}
*/

router.get('/', (req, res) => {
    try{
        const stmt = db.prepare('SELECT * FROM menus WHERE storeId=?');
        const result = stmt.all(req.query.storeId);
        res.json({ menus: result });
    }
    catch(err){
        console.error('가맹점 조회 실패: ', err);
        res.status(500).send("가맹점 조회 실패");
    }
});

// POST /api/menus
// body: { storeId, menuName, energy, carb, prot, fat }
// menus 테이블에 새 메뉴 삽입 (크라우드소싱)

router.post('/', (req, res) => {
    try{
        const stmt = db.prepare(`INSERT INTO menus(
                                 storeId, menuName, energy, carb, prot, fat
                                 ) VALUES (
                                    :storeId, :menuName, :energy, :carb, :prot, :fat 
                                 )
        `);
        stmt.run(req.body);
        res.status(200).send('추가 성공');
    }
    catch(err)
    {
        res.status(500).send('추가 중 error 발생');
        console.error(err);
    }
});

module.exports = router;
