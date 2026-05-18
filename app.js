const state = { mode: "single", last: null };

const $ = (id) => document.getElementById(id);
const n = (id) => parseFloat(String($(id).value).replace(",", "."));

function fmt(value, digits = 3) {
  if (typeof value === "string") return value;
  return Number(value).toLocaleString("de-DE", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}
function fmtLK(value) {
  return Number(value).toLocaleString("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
}
function round3(x) { return Math.round((x + Number.EPSILON) * 1000) / 1000; }
function truncate1(x) { return Math.trunc(x * 10) / 10; }
function clampLK(x) { return Math.min(25, Math.max(1.5, x)); }

function pointsFunction(d) {
  if (d <= -4) return 10;
  if (d <= -2) return 1.25 * d ** 3 + 15 * d ** 2 + 60 * d + 90;
  if (d <= 4) return 15 * d + 50;
  if (d <= 6) return -3.75 * d ** 2 + 45 * d - 10;
  return 125;
}

function hurdle(lk) {
  if (lk >= 10) return 10 * (30 - lk);
  return 10 * (30 - lk) + (6435 / 289) * ((20 * (5 - lk)) / (lk * lk + 1));
}

function ageFactor(age, gender) {
  if (age === "open") return 1.0;
  const a = parseInt(age, 10);
  const youthM = {10:.25,11:.30,12:.40,13:.50,14:.60,15:.70,16:.80,17:.90,18:1,21:1};
  const youthW = {10:.30,11:.40,12:.50,13:.60,14:.70,15:.80,16:.90,17:1,18:1,21:1};
  if (a <= 21) return gender === "w" ? youthW[a] : youthM[a];
  if (a >= 30) return Math.max(.30, (120 - a) / 100);
  return 1.0;
}

function validate(values) {
  return values.every(v => Number.isFinite(v) && v >= 1 && v <= 25);
}

function setMode(mode) {
  state.mode = mode;
  $("tab-single").classList.toggle("active", mode === "single");
  $("tab-double").classList.toggle("active", mode === "double");
  $("partnerWrap").classList.toggle("hidden", mode !== "double");
  $("opp2Wrap").classList.toggle("hidden", mode !== "double");
  $("partnerResultWrap").classList.toggle("hidden", mode !== "double");
  $("opp1Label").textContent = mode === "double" ? "Gegner 1 LK" : "Gegner-LK";
  calculate();
}

function calculate() {
  const my = n("myLk");
  const partner = n("partnerLk");
  const opp1 = n("opp1Lk");
  const opp2 = n("opp2Lk");
  const age = $("ageClass").value;
  const gender = $("gender").value;
  const A = ageFactor(age, gender);
  const Z = parseFloat($("scoring").value);
  const teamBonus = $("teamMatch").checked ? 1.10 : 1.0;
  const surcharge = $("weeklySurcharge").checked ? 0.025 : 0;

  const valuesToCheck = state.mode === "single" ? [my, opp1] : [my, partner, opp1, opp2];
  if (!validate(valuesToCheck)) {
    $("calcLines").textContent = "Bitte gültige LK-Werte zwischen 1,0 und 25,0 eintragen.";
    return;
  }

  let teamOwn = my;
  let teamOpp = opp1;
  let d, baseP, P, H, improvement, newMyComp, newMyLk, newPartnerComp = null, newPartnerLk = null, lines;

  if (state.mode === "double") {
    teamOwn = (my + partner) / 2;
    teamOpp = (opp1 + opp2) / 2;
  }

  d = teamOwn - teamOpp;
  baseP = pointsFunction(d);
  P = baseP * teamBonus;
  H = hurdle(teamOwn);
  improvement = round3(A * Z * P / H * (state.mode === "double" ? 0.5 : 1));

  newMyComp = round3(clampLK(my - improvement + surcharge));
  newMyLk = truncate1(newMyComp);

  $("newLk").textContent = fmtLK(newMyLk);
  $("newCompanion").textContent = fmt(newMyComp, 3);
  $("improvement").textContent = fmt(improvement, 3);
  $("points").textContent = fmt(P, 3);

  if (state.mode === "double") {
    newPartnerComp = round3(clampLK(partner - improvement + surcharge));
    newPartnerLk = truncate1(newPartnerComp);
    $("partnerResult").textContent = `${fmtLK(newPartnerLk)} / ${fmt(newPartnerComp, 3)}`;
  }

  lines =
`${state.mode === "single" ? "Einzel" : "Doppel / Mixed"}
Eigene Team-LK: ${fmt(teamOwn, 3)}
Gegnerische Team-LK: ${fmt(teamOpp, 3)}
LK-Differenz d: ${fmt(d, 3)}

Punkte P: ${fmt(baseP, 3)}${teamBonus > 1 ? " × 1,10 = " + fmt(P, 3) : ""}
Hürde H: ${fmt(H, 3)}
Altersklassenfaktor A: ${fmt(A, 2)}
Zählweisenfaktor Z: ${fmt(Z, 2)}
${state.mode === "double" ? "Doppel-Verteilung: 50 %\n" : ""}
Verbesserung: ${fmt(improvement, 3)}

Neue LK: ${fmtLK(newMyLk)}
Neuer Begleitwert: ${fmt(newMyComp, 3)}
${state.mode === "double" ? `Partner neue LK: ${fmtLK(newPartnerLk)}\nPartner neuer Begleitwert: ${fmt(newPartnerComp, 3)}` : ""}`;

  $("calcLines").textContent = lines;
  state.last = {
    date: new Date().toLocaleString("de-DE"),
    mode: state.mode === "single" ? "Einzel" : "Doppel / Mixed",
    my,
    partner,
    opp1,
    opp2,
    age: $("ageClass").selectedOptions[0].textContent,
    newMyLk,
    newMyComp,
    improvement,
    newPartnerLk,
    newPartnerComp
  };
}

function saveResult() {
  calculate();
  if (!state.last) return;
  const history = JSON.parse(localStorage.getItem("lkHistory") || "[]");
  history.unshift(state.last);
  localStorage.setItem("lkHistory", JSON.stringify(history.slice(0, 20)));
  renderHistory();
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem("lkHistory") || "[]");
  const box = $("history");
  if (!history.length) {
    box.className = "history empty";
    box.textContent = "Noch keine gespeicherten Ergebnisse.";
    return;
  }
  box.className = "history";
  box.innerHTML = history.map(item => {
    const partner = item.mode === "Doppel / Mixed" ? ` · Partner: LK ${fmtLK(item.newPartnerLk)}` : "";
    return `<div class="history-item">
      <b>${item.mode}: neue LK ${fmtLK(item.newMyLk)}${partner}</b>
      <span>${item.date} · ${item.age} · Verbesserung ${fmt(item.improvement,3)}</span>
    </div>`;
  }).join("");
}

function reset() {
  $("myLk").value = "13.195";
  $("partnerLk").value = "18.294";
  $("opp1Lk").value = "10.600";
  $("opp2Lk").value = "10.600";
  $("ageClass").value = "open";
  $("gender").value = "m";
  $("scoring").value = "1";
  $("teamMatch").checked = false;
  $("weeklySurcharge").checked = false;
  setMode("single");
}

["myLk","partnerLk","opp1Lk","opp2Lk","ageClass","gender","scoring","teamMatch","weeklySurcharge"].forEach(id => {
  $(id).addEventListener("input", calculate);
  $(id).addEventListener("change", calculate);
});
$("tab-single").addEventListener("click", () => setMode("single"));
$("tab-double").addEventListener("click", () => setMode("double"));
$("calcBtn").addEventListener("click", calculate);
$("saveBtn").addEventListener("click", saveResult);
$("resetBtn").addEventListener("click", reset);
$("clearHistoryBtn").addEventListener("click", () => {
  localStorage.removeItem("lkHistory");
  renderHistory();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

calculate();
renderHistory();
