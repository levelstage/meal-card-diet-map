const params = new URLSearchParams(window.location.search);
const storeId = params.get('id');

const VIEWS = ['view-store', 'view-menus', 'view-add-menu'];

function showView(id) {
  VIEWS.forEach(v => {
    document.getElementById(v).style.display = v === id ? 'block' : 'none';
  });
}

// 패널 1: 가맹점 정보

async function loadStoreInfo() {
  if (!storeId) {
    document.getElementById('store-name').textContent = '가게 정보를 찾을 수 없습니다';
    return;
  }
  try {
    const res = await fetch(`/api/stores/${encodeURIComponent(storeId)}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    renderStore(data.storeDetail);
  } catch {
    document.getElementById('store-name').textContent = '가게 정보를 불러올 수 없습니다';
  }
}

function renderStore(s) {
  document.getElementById('store-name').textContent = s.mrhstNm ?? '이름 없음';
  document.getElementById('store-info').innerHTML = `
    <p>주소: ${s.rdnmadr || s.lnmadr || '-'}</p>
    <p>전화: ${s.phoneNumber || '-'}</p>
    <p>평일: ${formatHours(s.weekdayOperOpenHhmm, s.WeekdayOperCloseHhmm)}</p>
    <p>토요일: ${formatHours(s.satOperOpenHhmm, s.satOperCloseHhmm)}</p>
  `;
}

function formatHours(open, close) {
  if (!open || !close) return '-';
  return `${open} ~ ${close}`;
}

document.getElementById('ate-btn').addEventListener('click', () => {
  loadMenus();
  showView('view-menus');
});

// 패널 2: 메뉴 목록

async function loadMenus() {
  try {
    const res = await fetch(`/api/menus?storeId=${encodeURIComponent(storeId)}`);
    const data = await res.json();
    renderMenus(data.menus);
  } catch {
    document.getElementById('menu-list').textContent = '메뉴를 불러올 수 없습니다';
  }
}

function renderMenus(menus) {
  const list = document.getElementById('menu-list');
  list.innerHTML = '';
  document.getElementById('meal-record-msg').textContent = '';

  if (!menus || menus.length === 0) {
    list.textContent = '등록된 메뉴가 없습니다';
    return;
  }

  menus.forEach(menu => {
    const btn = document.createElement('button');
    btn.textContent = menu.menuName;
    btn.addEventListener('click', () => recordMeal(menu));
    list.appendChild(btn);
  });
}

function recordMeal(menu) {
  const record = {
    date: new Date().toISOString(),
    storeId,
    menuName: menu.menuName,
    energy: menu.energy,
    carb: menu.carb,
    prot: menu.prot,
    fat: menu.fat,
  };
  const history = JSON.parse(localStorage.getItem('mealHistory') || '[]');
  history.push(record);
  localStorage.setItem('mealHistory', JSON.stringify(history));
  document.getElementById('meal-record-msg').textContent = `"${menu.menuName}"를 먹었습니다.`;
}

document.getElementById('back-to-store-btn').addEventListener('click', () => showView('view-store'));

document.getElementById('add-menu-btn').addEventListener('click', () => {
  document.getElementById('menu-name-input').value = '';
  document.getElementById('search-input').value = '';
  document.getElementById('search-results').innerHTML = '';
  showView('view-add-menu');
});

// 패널 3: 메뉴 추가

document.getElementById('search-btn').addEventListener('click', searchNutrition);
document.getElementById('search-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') searchNutrition();
});

async function searchNutrition() {
  const keyword = document.getElementById('search-input').value.trim();
  if (!keyword) return;

  const resultsDiv = document.getElementById('search-results');
  resultsDiv.textContent = '검색 중...';

  try {
    const res = await fetch(`/api/nutritions?name=${encodeURIComponent(keyword)}`);
    if (!res.ok) {
      resultsDiv.textContent = '검색 결과가 없습니다';
      return;
    }
    const data = await res.json();
    renderSearchResults(data.menus);
  } catch {
    resultsDiv.textContent = '검색 실패. 다시 시도해주세요';
  }
}

function renderSearchResults(menus) {
  const resultsDiv = document.getElementById('search-results');
  resultsDiv.innerHTML = '';

  if (!menus || menus.length === 0) {
    resultsDiv.textContent = '결과 없음';
    return;
  }

  menus.forEach(menu => {
    const div = document.createElement('div');
    div.innerHTML = `
      <span>${menu.menuName} | ${menu.energy ?? '-'}kcal - 탄 ${menu.carb ?? '-'}g - 단 ${menu.prot ?? '-'}g - 지 ${menu.fat ?? '-'}g</span>
      <button class="register-btn">영양성분 가져오기</button>
    `;
    div.querySelector('.register-btn').addEventListener('click', () => registerMenu(menu));
    resultsDiv.appendChild(div);
  });
}

async function registerMenu(nutrition) {
  const menuName = document.getElementById('menu-name-input').value.trim();
  if (!menuName) {
    alert('메뉴 이름을 입력해주세요');
    document.getElementById('menu-name-input').focus();
    return;
  }

  try {
    const res = await fetch('/api/menus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId,
        menuName,
        energy: nutrition.energy,
        carb: nutrition.carb,
        prot: nutrition.prot,
        fat: nutrition.fat,
      })
    });
    if (!res.ok) throw new Error();
    alert(`"${menuName}" 등록 완료!`);
    showView('view-menus');
    await loadMenus();
  } catch {
    alert('등록 실패. 다시 시도해주세요');
  }
}

document.getElementById('back-to-menus-btn').addEventListener('click', () => showView('view-menus'));

loadStoreInfo();
