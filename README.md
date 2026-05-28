# meal-card-diet-map

## 개발환경 세팅 (프론트엔드용)

### 사전 준비

- [Node.js](https://nodejs.org/) 18 이상 설치 확인
  ```
  node -v
  ```

---

### 1단계 — 저장소 클론 및 패키지 설치

```bash
git clone <저장소_URL>
cd meal-card-diet-map
npm install
```

---

### 2단계 — 압축파일 압축 해제

별도로 전달받은 압축파일을 열어서 아래 두 파일을 **프로젝트 루트**에 복사합니다.

```
meal-card-diet-map/
├── config_server.js   ← 압축파일에서 복사
└── stores.db          ← 압축파일에서 복사
```

> `stores.db`는 공공데이터포털 API를 통해 수집한 전국 아동급식카드 가맹점 데이터입니다.  
> 직접 수집하려면 `GET /api/loadStores/Reload` 를 호출해야 하며 완료까지 약 2시간이 걸립니다.

---

### 3단계 — 카카오맵 API 키 설정

`config_client.example.js` 파일을 복사해서 `config_client.js`를 만들고, 카카오 API 키를 입력합니다.

```bash
# Windows
copy config_client.example.js config_client.js

# Mac / Linux
cp config_client.example.js config_client.js
```

`config_client.js` 파일을 열어 키를 입력합니다.

```js
const CONFIG_CLIENT = {
  KAKAO_API_KEY: '여기에_실제_카카오_API_키_입력',
};
```

> 카카오 API 키는 [카카오 개발자 콘솔](https://developers.kakao.com/)에서 발급받을 수 있습니다.  
> 애플리케이션 등록 후 **JavaScript 키**를 사용합니다.

---

### 4단계 — 서버 실행

```bash
npm start
```

서버가 정상적으로 뜨면 [http://localhost:3000](http://localhost:3000) 에서 확인할 수 있습니다.

> `menus.db` 파일은 서버 최초 실행 시 자동으로 생성됩니다. 별도 작업 불필요합니다.

---

## 디렉토리 구조

```
meal-card-diet-map/
├── server.js                  # 서버 진입점 (포트 3000)
├── package.json
├── config_server.js           # (압축파일) 공공데이터 API 키, 식약처 API 키
├── config_server.example.js   # config_server.js 양식 참고용
├── config_client.js           # (직접 생성) 카카오맵 API 키
├── config_client.example.js   # config_client.js 양식 참고용
├── stores.db                  # (압축파일) 전국 아동급식카드 가맹점 DB
├── menus.db                   # (자동 생성) 가게별 메뉴 DB
├── db/
│   ├── initMenus.js           # 서버 시작 시 menus.db 초기화
│   └── loadStores.js          # 공공데이터 API → stores.db 수집 로직
├── routes/
│   ├── stores.js              # /api/stores
│   ├── menus.js               # /api/menus
│   └── nutrition.js           # /api/nutritions
└── public/                    # 프론트엔드 작업 영역
    ├── map.html
    ├── store.html
    ├── diet.html
    ├── demo.html              # API 테스트 페이지
    ├── js/
    │   ├── map.js
    │   ├── store.js
    │   └── diet.js
    └── css/
        └── style.css
```

---

## API 명세

서버가 실행된 상태에서 [http://localhost:3000/demo.html](http://localhost:3000/demo.html) 에 접속하면 모든 API를 브라우저에서 직접 테스트해볼 수 있습니다.

### 가맹점 (stores)

#### 주변 가맹점 목록 조회
```
GET /api/stores?lat={위도}&lng={경도}
```
현재 좌표 기준 약 반경 1km 내 가맹점 목록을 반환합니다.

```json
// 응답 예시
{
  "nearbyStores": [
    {
      "id": "연세식당_서울시서대문구연세로50",
      "mrhstNm": "연세식당",
      "latitude": 37.5596,
      "longitude": 126.9368,
      "rdnmadr": "서울시 서대문구 연세로 50",
      "phoneNumber": "02-000-0000",
      "weekdayOperOpenHhmm": "0900",
      "WeekdayOperCloseHhmm": "2100",
      ...
    }
  ]
}
```

#### 가맹점 상세 조회
```
GET /api/stores/:id
```

```json
// 응답 예시
{
  "storeDetail": {
    "id": "연세식당_서울시서대문구연세로50",
    "mrhstNm": "연세식당",
    ...
  }
}
```

---

### 메뉴 (menus)

#### 가게 메뉴 목록 조회
```
GET /api/menus?storeId={가게id}
```

```json
// 응답 예시
{
  "menus": [
    { "storeId": "연세식당_...", "menuName": "제육볶음", "energy": 650, "carb": 60, "prot": 30, "fat": 20 }
  ]
}
```

#### 메뉴 추가
```
POST /api/menus
Content-Type: application/json
```
```json
// 요청 바디
{
  "storeId": "연세식당_서울시서대문구연세로50",
  "menuName": "제육볶음",
  "energy": 650,
  "carb": 60,
  "prot": 30,
  "fat": 20
}
```

---

### 영양정보 검색 (nutritions)

식약처 외식 영양성분 DB에서 메뉴명으로 검색합니다.

```
GET /api/nutritions?name={메뉴명}
```
```json
// 응답 예시
{
  "menus": [
    { "menuName": "제육볶음", "energy": 648, "carb": 58.2, "prot": 29.1, "fat": 19.4 }
  ]
}
```

---

## 자주 묻는 것들

**Q. 서버 시작할 때 오류가 나요.**  
`config_server.js`와 `stores.db`가 프로젝트 루트에 있는지 확인하세요.

**Q. 지도가 안 뜨거나 카카오맵 관련 오류가 나요.**  
`config_client.js`에 카카오 API 키가 올바르게 입력되어 있는지 확인하세요.  
또한 카카오 개발자 콘솔에서 `localhost`가 허용 도메인에 등록되어 있어야 합니다.

**Q. `/api/stores` 에서 503 오류가 나요.**  
`stores.db`가 없거나 데이터가 비어있는 경우입니다. 압축파일에서 받은 `stores.db`를 루트에 두었는지 확인하세요.
