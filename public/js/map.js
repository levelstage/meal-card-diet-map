/* 전체 공통 레이아웃 */

/* 지도 컨테이너 */

/* 가맹점 메뉴 목록 */

/* 영양정보 카드 */

/* d3.js 차트 */

/* 하단 네비게이션 */




// map.html.js 기초css (수정바람)
// 1. DOM 객체 레퍼런스 선언 및 전역 데이터 보관용 변수 세팅
const mapContainer = document.getElementById('map'); 
const storeListContainer = document.getElementById('storeList');

let currentLat = null;
let currentLng = null;
let allStores = [];           // 서버에서 받아온 주변 전체 가맹점 원본 배열 보관용
let activeMarkers = [];        // 현재 지도 레이어에 표시 중인 마커 객체 배열 관리용
let currentRadius = 200;       // 디폴트 검색 범위 200m 설정
let currentCircle = null;      // 반경 시각화 원 객체 보관용 변수
let currentInfoWindow = null;  // 현재 지도에 열려있는 강조 말풍선 객체 보관 변수

// 2. 지도 생성 옵션 및 카카오맵 인스턴스 초기화
const mapOption = { 
    center: new kakao.maps.LatLng(37.566826, 126.9786567), // 기본 초기 서울 중심점
    level: 4 
}; 
const map = new kakao.maps.Map(mapContainer, mapOption); 

// 우측 슬라이더 바 및 드래그/핀치 줌 확대 축소 한계선만 유지 (불편해서 삭제)
map.setMinLevel(1); 
map.setMaxLevel(7); 

// 3. 두 좌표 기반으로 실제 거리(미터)를 산출해 내는 함수
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // 지구 반지름 단위: m
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
}

// 4. 지도 레이어 위에 띄워져 있는 기존 마커와 말풍선들을 완전히 소멸시키는 초기화 함수
function clearMarkers() {
    activeMarkers.forEach(marker => marker.setMap(null));
    activeMarkers = [];
    
    //  새로운 범위를 누르면 기존에 열려있던 강조 말풍선 초기화
    if (currentInfoWindow) {
        currentInfoWindow.close();
        currentInfoWindow = null;
    }
}

// 5. 거리 필터 조건에 맞춰 마커 핀과 하단 카드 리스트를 실시간으로 재렌더링하는 함수
function updateMapDisplay() {
    clearMarkers(); 
    storeListContainer.innerHTML = ''; 

    // 기존에 지도에 그려진 반경 원 청소
    if (currentCircle) {
        currentCircle.setMap(null);
        currentCircle = null;
    }

    //  내 위치 정보에서 반투명 파란색 원 그리기
    if (currentRadius !== Infinity && currentLat && currentLng) {
        currentCircle = new kakao.maps.Circle({
            center: new kakao.maps.LatLng(currentLat, currentLng), 
            radius: currentRadius,    
            strokeWeight: 1.5,        
            strokeColor: '#2196F3',   
            strokeOpacity: 0.7,       
            strokeStyle: 'solid',     
            fillColor: '#BBDEFB',     
            fillOpacity: 0.25         
        });
        currentCircle.setMap(map); 
    }

    // 내 위치 좌표 기준으로 사용자가 선택한 반경(m) 이내의 가맹점 데이터만 필터링
    const filteredStores = allStores.filter(store => {
        const distance = getDistance(currentLat, currentLng, store.latitude, store.longitude);
        store.displayDistance = Math.round(distance); 
        return distance <= currentRadius;
    });

    // 가까운 식당 순서대로 자동 정렬 (오름차순)
    filteredStores.sort((a, b) => a.displayDistance - b.displayDistance);

    // 반경 내에 해당하는 식당이 하나도 없을 경우 예외 화면 노출
    if (filteredStores.length === 0) {
        const radiusText = currentRadius === Infinity ? '전체' : (currentRadius === 1000 ? '1km' : `${currentRadius}m`);
        storeListContainer.innerHTML = `
            <div class="store-item">
                <div class="store-info">
                    <span class="store-name"> 선택하신 범위(${radiusText}) 내에 가맹점이 존재하지 않습니다.</span>
                </div>
            </div>`;
        return;
    }

    // 조건에 맞는 식당들만 선별하여 지도 마커 생성 및 하단 목록 리스트 요소 추가
    filteredStores.forEach(store => {
        const storePosition = new kakao.maps.LatLng(store.latitude, store.longitude);
        
        // 지도 핀 생성
        const marker = new kakao.maps.Marker({
            map: map,
            position: storePosition,
            title: store.mrhstNm
        });
        activeMarkers.push(marker);

        //  [노드 강조 공통 함수] 특정 마커를 말풍선과 함께 최상단 레이어로 부각
        function highlightStore() {
            // 1. 이미 열려있는 다른 말풍선이 있다면 닫아버림
            if (currentInfoWindow) {
                currentInfoWindow.close();
            }

            // 2. 가독성이 뛰어난 전용 강조 말풍선 컨텐츠 생성
            const infowindow = new kakao.maps.InfoWindow({
                content: `<div style="padding:6px;font-size:13px;font-weight:bold;text-align:center;color:#2e7d32;min-width:140px;">${store.mrhstNm}</div>`
            });
            infowindow.open(map, marker);
            currentInfoWindow = infowindow;

            // 3. 겹쳐있는 마커들 사이에서 독보적으로 보일 수 있게 z-index를 최상위(10)로 격상
            activeMarkers.forEach(m => m.setZIndex(1));
            marker.setZIndex(10);

            // 4. 지도의 중심을 해당 식당 위치로 이동
            map.panTo(storePosition);
        }

        //  지도 위의 마커 핀을 직접 클릭했을 때도 노드가 강조되도록 연동
        kakao.maps.event.addListener(marker, 'click', function() {
            highlightStore();
        });

        // 하단 리스트 구역에 꽂아 넣을 개별 카드 생성
        const storeItem = document.createElement('div');
        storeItem.className = 'store-item';
        storeItem.innerHTML = `
            <div class="store-info">
                <span class="store-name"> ${store.mrhstNm}</span>
                <span class="store-distance-text">${store.displayDistance}m</span>
            </div>
            <button class="view-detail-btn">상세보기</button>
        `;

        //  하단 리스트에서 가게 카드를 직접 클릭했을 때 노드 강력 강조 실행
        storeItem.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-detail-btn')) return;
            highlightStore();
        });

        // 상세보기 버튼 연동 (메뉴로 이동)
        const detailBtn = storeItem.querySelector('.view-detail-btn');
        detailBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            location.href = `/store?id=${store.id}`;
        });

        storeListContainer.appendChild(storeItem);
    });
}

// 6. 페이지 최초 접속 시 브라우저 GPS로 현재 위치 탐색 및 백엔드 동적 통신 시작
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
        currentLat = position.coords.latitude;
        currentLng = position.coords.longitude;
        const locPosition = new kakao.maps.LatLng(currentLat, currentLng);
        
        // 내 중심점 위치 마커 핀 꽂기
        new kakao.maps.Marker({ map: map, position: locPosition });
        map.setCenter(locPosition);

        // 원격 서버에 주변 매장 데이터 Fetch 요청
        fetch(`/api/stores?lat=${currentLat}&lng=${currentLng}`)
            .then(response => response.json())
            .then(data => {
                allStores = data.nearbyStores; // 캐시 저장소에 배열 백업
                updateMapDisplay();            
            })
            .catch(error => {
                console.error("가맹점 리스트 로딩 실패:", error);
                storeListContainer.innerHTML = '<div class="store-item"><span class="store-name">❌ 가맹점 데이터를 원격 서버에서 가져오지 못했습니다.</span></div>';
            });
            
    }, function(error) {
        alert("브라우저 위치 정보 제공 권한을 승인해주셔야 정상적인 서비스 이용이 가능합니다.");
    });
}

// 7. 내 위치 재조정 버튼 클릭 이벤트 리스너 정의
const myLocationBtn = document.getElementById('myLocationBtn');
myLocationBtn.addEventListener('click', function() {
    if (navigator.geolocation) {
        myLocationBtn.innerText = '🔄'; 
        navigator.geolocation.getCurrentPosition(function(position) {
            currentLat = position.coords.latitude;
            currentLng = position.coords.longitude;
            map.panTo(new kakao.maps.LatLng(currentLat, currentLng));
            myLocationBtn.innerText = '🎯';
            updateMapDisplay(); 
        });
    }
});

// 8. 거리 조절 상단 캡슐 버튼 토글 제어 이벤트 연결
document.querySelectorAll('.radius-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.radius-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        const radiusValue = e.target.getAttribute('data-radius');
        currentRadius = radiusValue === 'all' ? Infinity : parseInt(radiusValue);
        
        updateMapDisplay();
    });
});
