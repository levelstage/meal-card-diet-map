-- 참고용 스키마 정의

CREATE TABLE stores(
                id TEXT PRIMARY KEY,  -- 가맹점별 고유 식별자 (이름_도로명주소)
                mrhstNm TEXT,  -- 가맹점명
                mrhstCode TEXT,  -- 가맹점코드(음식점/편의점/마트)
                ctprvn TEXT,  -- 시도명
                signguNm TEXT,  -- 시군구명
                signguCode TEXT,  -- 시군구코드
                rdnmadr TEXT,  -- 도로명주소
                lnmadr TEXT,  -- 지번주소
                latitude REAL,  -- 위도
                longitude REAL,  -- 경도
                phoneNumber TEXT,  -- 전화번호
                weekdayOperOpenHhmm TEXT,  -- 평일운영시작시각
                WeekdayOperCloseHhmm TEXT,  -- 평일운영종료시각
                satOperOpenHhmm TEXT,  -- 토요일운영시작시각
                satOperCloseHhmm TEXT,  -- 토요일운영종료시각
                holidayOperOpenHhmm TEXT,  -- 공휴일운영시작시각
                holidayCloseOpenHhmm TEXT,  -- 공휴일운영종료시각
                dlvrOperOpenHhmm TEXT,  -- 배달시작시각
                dlvrCloseOpenHhmm TEXT,  -- 배달종료시각
                institutionNm TEXT,  -- 관리기관명
                institutionPhoneNumber TEXT,  -- 관리기관전화번호
                referenceDate TEXT,  -- 데이터기준일자
                instt_code TEXT  -- 제공기관코드
);
