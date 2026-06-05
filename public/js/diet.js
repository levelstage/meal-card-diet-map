'use strict';

const history = JSON.parse(localStorage.getItem('mealHistory') || '[]');
let weekOffset = 0;

function getWeekBounds(offset) {
  const today = new Date();
  const dow = today.getDay(); // 0=일
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

function getMealsForOffset(offset) {
  const { monday, sunday } = getWeekBounds(offset);
  return history.filter(r => {
    const d = new Date(r.date);
    return d >= monday && d <= sunday;
  });
}

function pad2(n) { return String(n).padStart(2, '0'); }

function formatDate(d) {
  return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`;
}

function formatDateTime(d) {
  return `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function render() {
  const { monday, sunday } = getWeekBounds(weekOffset);
  const meals = getMealsForOffset(weekOffset);

  document.getElementById('week-label').textContent =
    `${formatDate(monday)} ~ ${formatDate(sunday)}`;

  document.getElementById('prev-week-btn').disabled =
    getMealsForOffset(weekOffset - 1).length === 0;
  document.getElementById('next-week-btn').disabled =
    getMealsForOffset(weekOffset + 1).length === 0;

  document.getElementById('chart-container').innerHTML = '';
  document.getElementById('timeline-container').innerHTML = '';

  if (meals.length === 0) {
    const msg = document.createElement('p');
    msg.textContent = '이번 주 식단 기록이 없습니다';
    document.getElementById('chart-container').appendChild(msg);
    return;
  }

  renderGraph(meals);
  renderTimeline(meals);
}

function renderGraph(meals) {
  const mealMap = {};
  meals.forEach(r => {
    if (!mealMap[r.menuName]) mealMap[r.menuName] = { energy: 0, carb: 0, prot: 0, fat: 0 };
    const m = mealMap[r.menuName];
    m.energy += Number(r.energy) || 0;
    m.carb   += Number(r.carb)   || 0;
    m.prot   += Number(r.prot)   || 0;
    m.fat    += Number(r.fat)    || 0;
  });

  const mealNames = Object.keys(mealMap);
  const nutKeys   = ['energy', 'carb', 'prot', 'fat'];
  const nutLabels = ['에너지', '탄수화물', '단백질', '지방'];
  const nutUnits  = ['kcal', 'g', 'g', 'g'];
  const nutColors  = ['#e74c3c', '#f39c12', '#27ae60', '#3498db'];
  const mealColors = ['#4a90d9', '#7b68ee', '#5cb85c', '#f0ad4e', '#d9534f', '#17a2b8', '#e67e22', '#9b59b6'];

  const nutTotals = {};
  nutKeys.forEach(k => {
    nutTotals[k] = mealNames.reduce((sum, n) => sum + mealMap[n][k], 0);
  });

  // 실제 픽셀 기반 — viewBox 스케일링 없이 그려야 모바일에서 텍스트가 안 쪼그라듦
  const container = document.getElementById('chart-container');
  const W = Math.max(container.clientWidth || 320, 280);

  const NR     = mealNames.length;
  const MEAL_R = 12;
  const NUT_R  = 12;
  const FONT   = 11;
  const PAD_V  = 36;
  const ROW_H  = NR > 12 ? 34 : NR > 7 ? 40 : 50;

  const LEFT_X  = Math.round(W * 0.30);
  const RIGHT_X = Math.round(W * 0.70);

  const H = Math.max(NR, 4) * ROW_H + PAD_V * 2;

  const svg = d3.select('#chart-container')
    .append('svg')
    .attr('width', W)
    .attr('height', H);

  svg.append('defs').append('marker')
    .attr('id', 'arrowhead')
    .attr('viewBox', '0 0 10 10')
    .attr('refX', 10)
    .attr('refY', 5)
    .attr('markerWidth', 4)
    .attr('markerHeight', 4)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M 0 0 L 10 5 L 0 10 z')
    .attr('fill', '#aaa');

  const mealYs = mealNames.map((_, i) =>
    PAD_V + (H - PAD_V * 2) / (NR + 1) * (i + 1));
  const nutYs = nutLabels.map((_, i) =>
    PAD_V + (H - PAD_V * 2) / (nutLabels.length + 1) * (i + 1));

  // 간선
  const links = [];
  mealNames.forEach((name, mi) => {
    nutKeys.forEach((key, ni) => {
      const val = mealMap[name][key];
      const total = nutTotals[key];
      if (val > 0 && total > 0) links.push({ mi, ni, val, pct: val / total });
    });
  });

  svg.selectAll('path.link')
    .data(links)
    .enter()
    .append('path')
    .attr('d', d => {
      const sx = LEFT_X  + MEAL_R;
      const sy = mealYs[d.mi];
      const tx = RIGHT_X - NUT_R;
      const ty = nutYs[d.ni];
      const mx = (sx + tx) / 2;
      return `M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`;
    })
    .attr('stroke', d => nutColors[d.ni])
    .attr('stroke-width', d => Math.max(1, d.pct * 8))
    .attr('fill', 'none')
    .attr('opacity', 0.35)
    .attr('marker-end', 'url(#arrowhead)');

  // 식단 노드
  const maxLabelChars = Math.max(4, Math.floor((LEFT_X - MEAL_R - 8) / (FONT * 0.65)));

  const mealG = svg.selectAll('g.meal-node')
    .data(mealNames)
    .enter()
    .append('g')
    .attr('transform', (_, i) => `translate(${LEFT_X}, ${mealYs[i]})`);

  mealG.append('circle')
    .attr('r', MEAL_R)
    .attr('fill', (_, i) => mealColors[i % mealColors.length]);

  mealG.append('text')
    .attr('text-anchor', 'end')
    .attr('x', -(MEAL_R + 5))
    .attr('dy', '0.35em')
    .attr('font-size', FONT)
    .text(d => d.length > maxLabelChars ? d.slice(0, maxLabelChars - 1) + '…' : d);

  // 영양성분 노드 — 원 옆에 이름+합계를 나란히 표시 (원 안에 텍스트 넣지 않음)
  const nutG = svg.selectAll('g.nut-node')
    .data(nutLabels)
    .enter()
    .append('g')
    .attr('transform', (_, i) => `translate(${RIGHT_X}, ${nutYs[i]})`);

  nutG.append('circle')
    .attr('r', NUT_R)
    .attr('fill', (_, i) => nutColors[i]);

  nutG.append('text')
    .attr('text-anchor', 'start')
    .attr('x', NUT_R + 6)
    .attr('y', -3)
    .attr('font-size', FONT)
    .text(d => d);

  nutG.append('text')
    .attr('text-anchor', 'start')
    .attr('x', NUT_R + 6)
    .attr('y', FONT)
    .attr('font-size', FONT - 1)
    .attr('fill', '#888')
    .text((_, i) => `${Math.round(nutTotals[nutKeys[i]])}${nutUnits[i]}`);
}

function renderTimeline(meals) {
  const container = document.getElementById('timeline-container');

  const heading = document.createElement('h2');
  heading.textContent = '식단 기록';
  container.appendChild(heading);

  const sorted = [...meals].sort((a, b) => new Date(a.date) - new Date(b.date));

  const ul = document.createElement('ul');
  ul.className = 'timeline';

  sorted.forEach(r => {
    const li = document.createElement('li');
    li.innerHTML = `
      <time>${formatDateTime(new Date(r.date))}</time>
      <strong>${r.menuName}</strong>
      <span>${r.energy ?? '-'}kcal &nbsp; 탄 ${r.carb ?? '-'}g &nbsp; 단 ${r.prot ?? '-'}g &nbsp; 지 ${r.fat ?? '-'}g</span>
    `;
    ul.appendChild(li);
  });

  container.appendChild(ul);
}

document.getElementById('prev-week-btn').addEventListener('click', () => {
  weekOffset--;
  render();
});
document.getElementById('next-week-btn').addEventListener('click', () => {
  weekOffset++;
  render();
});

render();
