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




// 3. 메뉴 클릭 시 /api/nutrition?name= 호출 → 영양정보 카드 표시
function showNutrition(menu){}
// 4. "먹었어요" 클릭 시 { date, storeId, menuName, nutrition } → localStorage 저장
// 5. 새 메뉴 등록 폼 제출 시 POST /api/menus 호출
async function registerMenu(menu){}
