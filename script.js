const reveals = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
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
} else {
  reveals.forEach((item) => item.classList.add("visible"));
}

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

let kpiObserver = null;
if ("IntersectionObserver" in window) {
  kpiObserver = new IntersectionObserver(
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
}

const toNumber = (value) => {
  const cleaned = value.replace(/[^\d.-]/g, "");
  return Number(cleaned);
};

const inningsToOuts = (value) => {
  const matched = value.match(/(\d+)回(\d)\/3/);
  if (!matched) return 0;
  return Number(matched[1]) * 3 + Number(matched[2]);
};

const buildRankingCard = (root, title, items, formatter) => {
  const card = document.createElement("article");
  card.className = "ranking-card";
  card.innerHTML = `
    <h3 class="ranking-title">${title}</h3>
    <ol class="ranking-list">
      ${
        items.length > 0
          ? items
              .map(
                (player, i) => `
                <li>
                  <span class="rank-player">${i + 1}. ${player.name}</span>
                  <span class="rank-value">${formatter(player.value)}</span>
                </li>
              `
              )
              .join("")
          : `<li><span class="rank-player">対象選手なし</span><span class="rank-value">-</span></li>`
      }
    </ol>
  `;
  root.appendChild(card);
};

const battingRows = Array.from(document.querySelectorAll("#batting-stats-table tbody tr"));
const pitchingRows = Array.from(document.querySelectorAll("#pitching-stats-table tbody tr"));
const battingRankingRoot = document.querySelector("#batting-rankings");
const pitchingRankingRoot = document.querySelector("#pitching-rankings");
const seasonGames = document.querySelectorAll("#results-list li").length;
const minQualifiedPa = seasonGames * 1.0;
const minQualifiedInnings = seasonGames * 0.5;
const minQualifiedOuts = minQualifiedInnings * 3;

const seasonGamesBattingEl = document.querySelector("#season-games-batting");
const seasonGamesPitchingEl = document.querySelector("#season-games-pitching");
const qualifiedPaEl = document.querySelector("#qualified-pa");
const qualifiedInningsEl = document.querySelector("#qualified-innings");

if (seasonGamesBattingEl) seasonGamesBattingEl.textContent = String(seasonGames);
if (seasonGamesPitchingEl) seasonGamesPitchingEl.textContent = String(seasonGames);
if (qualifiedPaEl) qualifiedPaEl.textContent = String(minQualifiedPa);
if (qualifiedInningsEl) qualifiedInningsEl.textContent = String(minQualifiedInnings);

if (battingRows.length > 0 && battingRankingRoot) {
  const players = battingRows
    .map((row) => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 12) return null;
      return {
        name: cells[0].textContent.trim(),
        pa: toNumber(cells[3].textContent),
        avg: toNumber(cells[2].textContent),
        hr: toNumber(cells[6].textContent),
        rbi: toNumber(cells[7].textContent),
        ops: toNumber(cells[11].textContent),
      };
    })
    .filter(Boolean);

  const categories = [
    {
      label: "打率 TOP3",
      key: "avg",
      formatter: (v) => v.toFixed(3).replace(/^0/, "."),
      filter: (p) => p.pa >= minQualifiedPa,
    },
    { label: "本塁打 TOP3", key: "hr", formatter: (v) => String(v), filter: () => true },
    { label: "打点 TOP3", key: "rbi", formatter: (v) => String(v), filter: () => true },
    {
      label: "OPS TOP3",
      key: "ops",
      formatter: (v) => v.toFixed(3).replace(/^0/, "."),
      filter: (p) => p.pa >= minQualifiedPa,
    },
  ];

  categories.forEach((category) => {
    const top3 = [...players]
      .filter(category.filter)
      .sort((a, b) => b[category.key] - a[category.key])
      .slice(0, 3);

    buildRankingCard(
      battingRankingRoot,
      category.label,
      top3.map((player) => ({ name: player.name, value: player[category.key] })),
      category.formatter
    );
  });
}

if (pitchingRows.length > 0 && pitchingRankingRoot) {
  const pitchers = pitchingRows
    .map((row) => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 11) return null;
      return {
        name: cells[0].textContent.trim(),
        outs: inningsToOuts(cells[6].textContent),
        win: toNumber(cells[2].textContent),
        era: toNumber(cells[9].textContent),
        so: toNumber(cells[10].textContent),
      };
    })
    .filter(Boolean);

  const categories = [
    { label: "勝利数 TOP3", key: "win", asc: false, formatter: (v) => String(v), filter: () => true },
    { label: "奪三振 TOP3", key: "so", asc: false, formatter: (v) => String(v), filter: () => true },
    {
      label: "防御率 TOP3",
      key: "era",
      asc: true,
      formatter: (v) => v.toFixed(2),
      filter: (p) => p.outs >= minQualifiedOuts,
    },
  ];

  categories.forEach((category) => {
    const top3 = [...pitchers]
      .filter(category.filter)
      .sort((a, b) =>
        category.asc ? a[category.key] - b[category.key] : b[category.key] - a[category.key]
      )
      .slice(0, 3);

    buildRankingCard(
      pitchingRankingRoot,
      category.label,
      top3.map((player) => ({ name: player.name, value: player[category.key] })),
      category.formatter
    );
  });
}

const playersCount = battingRows.length;
const seasonRbi = battingRows.reduce((sum, row) => {
  const cells = row.querySelectorAll("td");
  return sum + toNumber(cells[7].textContent);
}, 0);
const seasonWins = pitchingRows.reduce((sum, row) => {
  const cells = row.querySelectorAll("td");
  return sum + toNumber(cells[2].textContent);
}, 0);

const setKpiValue = (id, value) => {
  const el = document.querySelector(id);
  if (!el) return;
  el.dataset.target = String(value);
  if (kpiObserver) {
    el.textContent = "0";
    kpiObserver.observe(el);
  } else {
    el.textContent = String(value);
  }
};

setKpiValue("#kpi-players", playersCount);
setKpiValue("#kpi-rbi", seasonRbi);
setKpiValue("#kpi-wins", seasonWins);
