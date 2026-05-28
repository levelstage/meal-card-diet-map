-- 참고용 스키마 정의

CREATE TABLE IF NOT EXISTS menus (
  storeId   TEXT,       -- 공공데이터 가맹점 고유 ID
  menuName TEXT,       -- 메뉴명 (예: "기본 김밥")
  energy REAL,  -- 칼로리
  carb REAL,  -- 탄수화물함량
  prot REAL,  -- 단백질함량
  fat REAL,  -- 지방함량
  PRIMARY KEY (storeId, menuName)
);