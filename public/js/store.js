// 1. URL 쿼리스트링에서 storeId 파싱

//지도에서 넘겨주는 파라미터 이름: id 로 가정
const params= new URLSearchParams(window.location.search);
const storeId= params.get('id');

let selectedMenu= null; //선택한 메뉴

// 2-1. /api/stores/:id 호출 → 가게 정보 렌더링
async function loadStoreInfo() {
  if(!storeId){
    document.getElementById('store-name').textContent= '가게 정보를 찾을 수 없습니다';
    return;
  }
  try{
    const res= await fetch(`/api/stores/$(encodeURIComponent(storeId)}`);
    if(!res.ok) throw new Error();
    const data= await res.json();
    renderStore(data.storeDetail);
    await loadMenus();
  }catch{
    document.getElementById('store-name').textContent= '가게 정보를 불러올 수 없습니다';
  }
}

function renderStore(s){
  document.getElementById('store-name').textContent= s.mrhstNm ?? '이름 없음';

  const info= document.getElementById('store-info');
  info.innerHTML=`
    <p>주소: ${s.rdnmadr || s.lnmadr || '-'}</p>
    <p>전화: ${s.phoneNumber ||'-'}</p>
    <p>평일: ${formatHours(s.weekdayOperOpenHhmm, s.WeekdayOperCloseHhmm)}</p>
    <p>토요일: ${formatHours(s.satOperOpenHhmm, s.satOperCloseHhmm)}</p>
  `;
}
function formatHours(open, close){
  if(!open || !close) return '-';
  return `${open} ~ ${close}`;
}



// 2-2. /api/menus?storeId= 호출 → 메뉴 목록 렌더링
async function loadMenus(){
  try{
    const res= await fetch(`/api/menus?storeId=${encodeURIComponent(storeId)}`);
    const data= await res.json();
    renderMenus(data.menus);
  }catch{
    document.getElementById('menu-list').textContent= '메뉴를 불러올 수 없습니다';
  }
}

function renderMenus(menus){
  const list= document.getElementById('menu-list');
  list.innerHTML='';

  if(!menus || menus.length ===0){
    list.textContent='등록된 메뉴가 없습니다';
    return;
  }

  menus.forEach(menu=> {
    const btn= document.createElement('button');
    btn.textContent= menu.menuName;

    btn.addEventListener('click', ()=> showNutrition(menu));
    list.appendChild(btn);
  });
}




// 3. 메뉴 클릭 시 영양정보 카드 표시
function showNutrition(menu){
  selectedMenu= menu;

  const card= document.getElementById('nutrition-card');
  const detail=document.getElementById('nutrition-detail');
  const ateBtn= document.getElementById('ate-btn');


  detail.textContent= `${menu.menuName} | ${menu.energy??'-'}kcal - 탄수화물 ${menu.carb??'-'}g - 지방 ${menu.fat??'-'}g`;

  card.style.display= 'block';
  ateBtn.style.display= 'inline-block';
  ateBtn.textContent= '먹었어요';
  ateBtn.disabled= false;
  
}
// 4. "먹었어요" 클릭 시 { date, storeId, menuName, nutrition } → localStorage 저장

document.getElementById('ate-btn').addEventListener('click', ()=> {
  if(!selectedMenu) return;

  const record={
    date: new Date().toISOString(),
    storeId: storeId;
    menuName: selectedMenu.menuName,
    energy: selectedMenu.carb,
    prot: selectedMenu.prot,
    fat: selectedMenu.fat,};

  const history= JSON.parse(localStorage.getItem('mealHistory')||'[]');
  history.push(record);
  localStorage.setItem('mealHistory', JSON.stringify(history));

  alert(`"${selectedMenu.menuName}" 섭취 기록이 저장되었습니다!`);
  document.getElementById('ate-btn').textContent= 'ㅇ 기록됨';
  document.getElementById('ate-btn').disabled= true;
});


//새 메뉴 등록 폼

document.getElementById('search-btn').addEventListener('click', searchNutrition);
document.getElementById('search-input').addEventListener('keydown', (e)=>{
  if(e.key==='Enter') searchNutrition();
});

async function searchNutrition(){
  const keyword= document.getElementById('search-input').value.trim();
  if(!keyword) return;

  const resultsDiv=document.getElementById('search-results');
  resultsDiv.textContent= '검색 중...';

  try{
    const res= await fetch(`/api/nutritions?name=${encodeURIComponent(keyword)}`);
    if(!res.ok){
      resultsDiv.textContent= '검색 결과가 없습니다';
      return;
    }
    const data=await res.json();
    renderSearchResults(data.menus);
  }catch{
    resultsDiv.textContent='검색 실패. 다시 시도해주세요';
  }
}

function renderSearchResults(menus){
  const resultsDiv= document.getElementById('search-results');
  resultsDiv.innerHTML='';

  if(!menus || menus.length===0){
    resultsDiv.textContent='결과 없음';
    return;
  }

  menus.forEach(menu=> {
    const div=document.createElement('div');
    div.innerHTML=
      `<span>${menu.menuName} | ${menu.energy??'-'}kcal - 탄 ${menu.carb??'-'}g - 단 ${menu.prot??'-'}g - 지${menu.fat??'-'}g</span>
      <button class="register-btn">등록</button>`;

    div.querySelector('.register-btn').addEventListener('click', ()=>registerMenu(menu));
    resultsDiv.appendChild(div);
  });
  
}

// 5. 새 메뉴 등록 폼 제출 시 POST /api/menus 호출
async function registerMenu(menu){
  try{
    const res= await fetch('/api/menus', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        storeId: storeId,
        menuName: menu.menuName,
        energy: menu.energy,
        carb: menu.carb,
        prot: menu.prot,
        fat: menu.fat,
      })
    });

    if(!res.ok) throw new Error();
    alert(`"${menu.menuName}" 등록 완료!`);
    document.getElementById('search-results').innerHTML='';
    document.getElementById('search-input').value='';
    await loadMenus();
  }catch{
    alert('등록 실패. 다시 시도해주세요');
  }
}

loadStoreInfo();
