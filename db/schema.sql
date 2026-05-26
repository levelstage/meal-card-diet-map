-- 참고용 스키마 정의 (실제 테이블 생성은 db/init.js 에서 수행)

CREATE TABLE IF NOT EXISTS menus (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id   TEXT NOT NULL,       -- 공공데이터 가맹점 고유번호
  name       TEXT NOT NULL,       -- 메뉴명 (예: "기본 김밥")
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);
