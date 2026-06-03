const history =
  JSON.parse(localStorage.getItem("mealHistory") || "[]");

const today = new Date();

const dailyData = [];

// 최근 7일 초기화
for (let i = 6; i >= 0; i--) {
  const d = new Date();
  d.setDate(today.getDate() - i);

  const key = d.toISOString().slice(0, 10);

  dailyData.push({
    date: key,
    energy: 0,
    carb: 0,
    prot: 0,
    fat: 0
  });
}

// 날짜별 합산
history.forEach(record => {

  const recordDate =
    new Date(record.date)
      .toISOString()
      .slice(0, 10);

  const day = dailyData.find(
    d => d.date === recordDate
  );

  if (!day) return;

  day.energy += Number(record.energy) || 0;
  day.carb += Number(record.carb) || 0;
  day.prot += Number(record.prot) || 0;
  day.fat += Number(record.fat) || 0;
});

renderChart(dailyData);
showAdvice(dailyData);

function renderChart(data) {

  const width = 700;
  const height = 350;
  const margin = 40;

  const svg = d3
    .select("#chart-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3.scaleBand()
    .domain(data.map(d => d.date.slice(5)))
    .range([margin, width - margin])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([
      0,
      d3.max(data, d => d.energy) || 100
    ])
    .nice()
    .range([height - margin, margin]);

  svg.append("g")
    .attr(
      "transform",
      `translate(0,${height - margin})`
    )
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr(
      "transform",
      `translate(${margin},0)`
    )
    .call(d3.axisLeft(y));

  svg.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", d => x(d.date.slice(5)))
    .attr("y", d => y(d.energy))
    .attr("width", x.bandwidth())
    .attr("height",
      d => height - margin - y(d.energy)
    );
}

function showAdvice(data) {

  let totalEnergy = 0;
  let totalCarb = 0;
  let totalProt = 0;
  let totalFat = 0;

  data.forEach(day => {
    totalEnergy += day.energy;
    totalCarb += day.carb;
    totalProt += day.prot;
    totalFat += day.fat;
  });

  const messages = [];

  if (totalEnergy < 14000)
    messages.push("칼로리가 부족합니다.");

  if (totalCarb < 900)
    messages.push("탄수화물이 부족합니다.");

  if (totalProt < 350)
    messages.push("단백질이 부족합니다.");

  if (totalFat < 350)
    messages.push("지방이 부족합니다.");

  if (messages.length === 0)
    messages.push("최근 7일 영양 상태가 양호합니다.");

  document.getElementById(
    "advice-message"
  ).innerHTML = messages.join("<br>");
}
