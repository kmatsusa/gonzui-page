const reveals = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

reveals.forEach((item) => revealObserver.observe(item));

const kpiValues = document.querySelectorAll(".kpi-value");

const animateNumber = (el) => {
  const target = Number(el.dataset.target || 0);
  const duration = 1000;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = String(Math.floor(progress * target));
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
};

const kpiObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateNumber(entry.target);
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.8 }
);

kpiValues.forEach((item) => kpiObserver.observe(item));

const toNumber = (value) => {
  const cleaned = value.replace(/[^\d.-]/g, "");
  return Number(cleaned);
};

const basicRows = Array.from(
  document.querySelectorAll("#basic-stats-table tbody tr")
);
const advancedRows = Array.from(
  document.querySelectorAll("#advanced-stats-table tbody tr")
);
const rankingRoot = document.querySelector("#batting-rankings");

if (basicRows.length > 0 && advancedRows.length > 0 && rankingRoot) {
  const players = basicRows.map((row, idx) => {
    const cells = row.querySelectorAll("td");
    const advCells = advancedRows[idx].querySelectorAll("td");
    return {
      name: cells[0].textContent.trim(),
      avg: toNumber(cells[2].textContent),
      hr: toNumber(cells[6].textContent),
      rbi: toNumber(cells[7].textContent),
      ops: toNumber(advCells[4].textContent),
    };
  });

  const categories = [
    { label: "打率 TOP3", key: "avg", formatter: (v) => v.toFixed(3).replace(/^0/, ".") },
    { label: "本塁打 TOP3", key: "hr", formatter: (v) => String(v) },
    { label: "打点 TOP3", key: "rbi", formatter: (v) => String(v) },
    { label: "OPS TOP3", key: "ops", formatter: (v) => v.toFixed(3).replace(/^0/, ".") },
  ];

  categories.forEach((category) => {
    const top3 = [...players]
      .sort((a, b) => b[category.key] - a[category.key])
      .slice(0, 3);

    const card = document.createElement("article");
    card.className = "ranking-card";
    card.innerHTML = `
      <h3 class="ranking-title">${category.label}</h3>
      <ol class="ranking-list">
        ${top3
          .map(
            (player, i) => `
              <li>
                <span class="rank-player">${i + 1}. ${player.name}</span>
                <span class="rank-value">${category.formatter(player[category.key])}</span>
              </li>
            `
          )
          .join("")}
      </ol>
    `;
    rankingRoot.appendChild(card);
  });
}
