const mapContainer = document.getElementById('map');
const storeListContainer = document.getElementById('storeList');

let activeMarkers = [];
let currentInfoWindow = null;

const map = new kakao.maps.Map(mapContainer, {
    center: new kakao.maps.LatLng(37.566826, 126.9786567),
    level: 4
});
map.setMinLevel(1);
map.setMaxLevel(3);

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function clearMarkers() {
    activeMarkers.forEach(m => m.setMap(null));
    activeMarkers = [];
    if (currentInfoWindow) {
        currentInfoWindow.close();
        currentInfoWindow = null;
    }
}

function renderStores(stores) {
    clearMarkers();
    storeListContainer.innerHTML = '';

    const center = map.getCenter();
    stores.forEach(store => {
        store.displayDistance = Math.round(getDistance(center.getLat(), center.getLng(), store.latitude, store.longitude));
    });
    stores.sort((a, b) => a.displayDistance - b.displayDistance);

    if (stores.length === 0) {
        storeListContainer.innerHTML = `
            <div class="store-item">
                <div class="store-info">
                    <span class="store-name">주변 1km 내에 가맹점이 존재하지 않습니다.</span>
                </div>
            </div>`;
        return;
    }

    stores.forEach(store => {
        const storePosition = new kakao.maps.LatLng(store.latitude, store.longitude);
        const marker = new kakao.maps.Marker({ map, position: storePosition, title: store.mrhstNm });
        activeMarkers.push(marker);

        function highlight() {
            if (currentInfoWindow) currentInfoWindow.close();
            const iw = new kakao.maps.InfoWindow({
                content: `<div style="padding:6px;font-size:13px;font-weight:bold;text-align:center;color:#2e7d32;min-width:140px;">${store.mrhstNm}</div>`
            });
            iw.open(map, marker);
            currentInfoWindow = iw;
            activeMarkers.forEach(m => m.setZIndex(1));
            marker.setZIndex(10);
            map.panTo(storePosition);
        }

        kakao.maps.event.addListener(marker, 'click', highlight);

        const item = document.createElement('div');
        item.className = 'store-item';
        item.innerHTML = `
            <div class="store-info">
                <span class="store-name"> ${store.mrhstNm}</span>
                <span class="store-distance-text">${store.displayDistance}m</span>
            </div>
            <button class="view-detail-btn">상세보기</button>
        `;
        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-detail-btn')) return;
            highlight();
        });
        item.querySelector('.view-detail-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            location.href = `/store?id=${store.id}`;
        });

        storeListContainer.appendChild(item);
    });
}

async function fetchAndRender() {
    const center = map.getCenter();
    storeListContainer.innerHTML = '<div class="store-item"><span class="store-name"> 가맹점 목록 로딩 중...</span></div>';
    try {
        const res = await fetch(`/api/stores?lat=${center.getLat()}&lng=${center.getLng()}`);
        const data = await res.json();
        renderStores(data.nearbyStores);
    } catch (err) {
        console.error('가맹점 리스트 로딩 실패:', err);
        storeListContainer.innerHTML = '<div class="store-item"><span class="store-name">❌ 가맹점 데이터를 불러오지 못했습니다.</span></div>';
    }
}

kakao.maps.event.addListener(map, 'idle', fetchAndRender);

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            map.setCenter(new kakao.maps.LatLng(position.coords.latitude, position.coords.longitude));
        },
        () => {
            alert('브라우저 위치 정보 제공 권한을 승인해주셔야 정상적인 서비스 이용이 가능합니다.');
        }
    );
}

const myLocationBtn = document.getElementById('myLocationBtn');
myLocationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) return;
    myLocationBtn.innerText = '🔄';
    navigator.geolocation.getCurrentPosition((position) => {
        map.setCenter(new kakao.maps.LatLng(position.coords.latitude, position.coords.longitude));
        myLocationBtn.innerText = '🎯';
    });
});
