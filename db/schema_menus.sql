-- 참고용 스키마 정의

CREATE TABLE IF NOT EXISTS menus (
  storeId   TEXT,       -- 공공데이터 가맹점 고유 ID
  menuNameame TEXT PRIMARY KEY,       -- 메뉴명 (예: "기본 김밥")
  energy INT,  -- 칼로리
  carb INT,  -- 탄수화물함량
  prot INT,  -- 단백질함량
  fat INT  -- 지방함량
);