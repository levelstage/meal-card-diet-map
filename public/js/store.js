// 1. URL 쿼리스트링에서 storeId 파싱
// 2. /api/menus?storeId= 호출 → 메뉴 목록 렌더링
// 3. 메뉴 클릭 시 /api/nutrition?name= 호출 → 영양정보 카드 표시
// 4. "먹었어요" 클릭 시 { date, storeId, menuName, nutrition } → localStorage 저장
// 5. 새 메뉴 등록 폼 제출 시 POST /api/menus 호출
