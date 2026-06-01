// 1. localStorage에서 최근 7일치 식사 기록 읽기

const history =
    JSON.parse(localStorage.getItem('mealHistory') || '[]');

// 2. 날짜별로 영양소(칼로리, 탄수화물, 단백질, 지방) 합산

record.date
record.energy
record.carb
record.prot
record.fat

for (history) {
    if (history.energy < 1000) {output.innerhtml="칼로리가 부족합니다."}
    if (history.carb < 510) {output.innerhtml="탄수화물이 부족합니다."}
    if (history.prot < 180) {output.innerhtml="단백질이 부족합니다."}
    if (history.fat < 330) {output.innerhtml="지방이 부족합니다."}
}

// 3. d3.js로 주간 막대 차트 렌더링

fetch("graph.json")
  .then(res => res.json())
  .then(data => {
  const nodes = data.nodes;
  const links = data.edges;

  const svg = d3.select("#d3-container");

  // 노드 id를 기준으로 실제 노드 객체를 찾기 위한 Map 생성
  const nodeById = new Map(nodes.map(d => [d.id, d]));

  // 엣지의 source, target id를 실제 노드 객체와 연결
  links.forEach(link => {
    link.sourceNode = nodeById.get(link.source);
    link.targetNode = nodeById.get(link.target);
  });

  // 엣지 선 그리기
  svg.selectAll("line")
    .data(links)
    .enter()
    .append("line")
    .attr("x1", d => d.sourceNode.x)
    .attr("y1", d => d.sourceNode.y)
    .attr("x2", d => d.targetNode.x)
    .attr("y2", d => d.targetNode.y)
    .attr("stroke", d => d.color)
    .attr("stroke-width", d => d.size);

  // 엣지 라벨 그리기
  svg.selectAll(".edge-label")
    .data(links)
    .enter()
    .append("text")
    .attr("class", "edge-label")
    .attr("x", d => (d.sourceNode.x + d.targetNode.x) / 2)
    .attr("y", d => (d.sourceNode.y + d.targetNode.y) / 2 - 8)
    .attr("text-anchor", "middle")
    .attr("font-size", "13px")
    .attr("fill", "#333")
    .text(d => d.label);

  // 노드 원 그리기
  svg.selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", d => d.size)
    .attr("fill", d => d.color)
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .style("cursor", "pointer")
    .on("click", (event, d) => {
      alert("클릭한 노드: " + d.label);
    });

  // 노드 라벨 그리기
  svg.selectAll(".node-label")
    .data(nodes)
    .enter()
    .append("text")
    .attr("class", "node-label")
    .attr("x", d => d.x)
    .attr("y", d => d.y - d.size - 8)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("font-weight", "bold")
    .text(d => d.label);
});

// ── 상수 ──────────────────────────────────────────────────
const WIDTH = 900, HEIGHT = 520;

// 노드 유형별 색상 [fill, stroke, text]
const COLOR = {
  movie:  ["#E6F1FB","#185FA5","#0C447C"],
  decade: ["#FAEEDA","#854F0B","#633806"],
  rating: ["#FDE8E8","#C0392B","#3C3489"]
};
const LINK_COLOR = { decade:"#BA7517", rating:"#E74C3C" };

// JSON 로드 → 초기화
fetch("movies.json")
  .then(r => r.json())
  .then(init);

function init(data) {
  // 데이터 정규화 (movie_title, release_date → 내부 필드명으로 변환)
  const movies = data.map(m => ({
    id:       m.movie_title.replace(/\WIDTH+/g, "_"),
    title:    m.movie_title,
    year:     +m.release_date.slice(0, 4),
    rate:     m.rate,
    img:      m.img,
    overview: m.overview,
    type:     "movie"
  }));

  // 개봉연도 그룹 딕셔너리  예) { "1990s": ["Toy_Story", ...] }
  const decades = {};
  movies.forEach(m => {
    const k = Math.floor(m.year / 10) * 10 + "s";
    (decades[k] = decades[k] || []).push(m.id);
  });
  // 평점 그룹 딕셔너리
  const ratings = {};
  movies.forEach(m => {
    const k = m.rate >= 7.5 ? "높음(≥7.5)" : m.rate >= 6.5 ? "중간(6.5~7.4)" : "낮음(<6.5)";
    (ratings[k] = ratings[k] || []).push(m.id);
  });

  // buildGraph: 필터에 맞는 nodes / links 반환
  function buildGraph(filter) {
    const nodes = movies.map(m => ({...m})); // 영화 노드는 항상 포함
    const links = [];

    if (filter === "all" || filter === "decade") {
      Object.entries(decades).forEach(([k, ids]) => {
        nodes.push({ id:"d_"+k, title:k, type:"decade" });
        ids.forEach(id => links.push({ source:"d_"+k, target:id, type:"decade" }));
      });
    }
    if (filter === "all" || filter === "rating") {
      Object.entries(ratings).forEach(([k, ids]) => {
        nodes.push({ id:"r_"+k, title:k, type:"rating" });
        ids.forEach(id => links.push({ source:"r_"+k, target:id, type:"rating" }));
      });
    }
    return { nodes, links };
  }

  // render: SVG 초기화 후 Force Graph 그리기
  function render(filter) {
    const { nodes, links } = buildGraph(filter);
    const svg = d3.select("#kg").attr("viewBox", `0 0 ${WIDTH} ${HEIGHT}`);
    svg.selectAll("*").remove();

    // 화살표 마커 (엣지 끝에 부착)
    const defs = svg.append("defs");
    ["decade", "rating"].forEach(t =>
      defs.append("marker").attr("id", "a-"+t)
        .attr("viewBox","0 0 10 10").attr("refX",20).attr("refY",5)
        .attr("markerWidth",5).attr("markerHeight",5).attr("orient","auto-start-reverse")
        .append("path").attr("d","M2 1L8 5L2 9")
        .attr("fill","none").attr("stroke", LINK_COLOR[t]).attr("stroke-width",1.5).attr("stroke-linecap","round")
    );

    // 줌/패닝 컨테이너
    const g = svg.append("g");
    svg.call(d3.zoom().scaleExtent([0.3, 3]).on("zoom", e => g.attr("transform", e.transform)));

    // 엣지 그리기
    const link = g.append("g").selectAll("line").data(links).join("line")
      .attr("stroke", d => LINK_COLOR[d.type])
      .attr("stroke-opacity", 0.5)
      .attr("marker-end", d => `url(#a-${d.type})`);

    // 노드 그룹 (드래그 + 클릭)
    const node = g.append("g").selectAll("g").data(nodes).join("g")
      .attr("cursor", "pointer")
      .call(d3.drag()
        .on("start", (e,d) => { if(!e.active) sim.alphaTarget(0.3).restart(); d.fx=d.x; d.fy=d.y; })
        .on("drag",  (e,d) => { d.fx=e.x; d.fy=e.y; })
        .on("end",   (e,d) => { if(!e.active) sim.alphaTarget(0); d.fx=d.fy=null; })
      )
      .on("click", (e,d) => { if(d.type === "movie") showCard(d); }); // 영화 노드 클릭 → 카드

    // 타원 노드
    node.append("ellipse")
      .attr("rx", d => d.type === "movie" ? 38 : 30)
      .attr("ry", d => d.type === "movie" ? 18 : 14)
      .attr("fill",         d => COLOR[d.type][0])
      .attr("stroke",       d => COLOR[d.type][1])
      .attr("stroke-width", 0.8);

    // 텍스트 레이블 (13자 초과 시 말줄임)
    node.append("text")
      .attr("text-anchor","middle").attr("dominant-baseline","central")
      .attr("fill",       d => COLOR[d.type][2])
      .attr("font-size",  d => d.type === "movie" ? 10 : 9)
      .attr("font-family","sans-serif")
      .text(d => d.title.length > 13 ? d.title.slice(0,12)+"…" : d.title);

    // Force Simulation (물리 기반 자동 배치)
    const sim = d3.forceSimulation(nodes)
      .force("link",    d3.forceLink(links).id(d => d.id).distance(90).strength(0.5))
      .force("charge",  d3.forceManyBody().strength(-200))  // 노드 간 반발력
      .force("center",  d3.forceCenter(WIDTH/2, HEIGHT/2))
      .force("collide", d3.forceCollide(d => d.type === "movie" ? 50 : 38)) // 겹침 방지
      .on("tick", () => {
        link.attr("x1",d=>d.source.x).attr("y1",d=>d.source.y)
            .attr("x2",d=>d.target.x).attr("y2",d=>d.target.y);
        node.attr("transform", d => `translate(${d.x},${d.y})`);
      });

    updateButtons(filter);
    updateLegend(filter);
  }

  // showCard: 영화 상세 카드 표시
  function showCard(d) {
    document.getElementById("card-img").src      = "images/" + `${d.img}`;
    document.getElementById("card-title").textContent    = `🎬 ${d.title} (${d.year})`;
    document.getElementById("card-meta").textContent     = `⭐ ${d.rate} / 10`;
    document.getElementById("card-overview").textContent = d.overview || "";
    document.getElementById("card").classList.add("show");
  }

  // 전역 노출 (HTML onclick에서 호출)
  window.filterBy  = f => render(f);
  window.closeCard = () => document.getElementById("card").classList.remove("show");

  // 버튼 활성 상태 업데이트
  function updateButtons(active) {
    ["all","decade","rating"].forEach(f =>
      document.getElementById("btn-"+f).classList.toggle("active", f === active)
    );
  }

  // 범례 업데이트 (현재 필터에 표시되는 유형만)
  function updateLegend(filter) {
    const items = [{c:"#185FA5",f:"#E6F1FB",l:"영화 (클릭 시 상세보기)"}];
    if (filter==="all"||filter==="decade") items.push({c:"#854F0B",f:"#FAEEDA",l:"개봉연도"});
    if (filter==="all"||filter==="rating") items.push({c:"#534AB7",f:"#EEEDFE",l:"평점"});
    document.getElementById("legend").innerHTML = items.map(i =>
      `<span class="legend-item">
        <span class="legend-dot" style="background:${i.f};border:1px solid ${i.c}"></span>${i.l}
      </span>`
    ).join("");
  }

  render("all"); // 초기 렌더링
}

// 4. 권장량 대비 부족한 영양소 탐지 → 조언 메시지 표시

// 위에서 처리
