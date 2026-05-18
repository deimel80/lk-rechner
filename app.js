const state = { mode: "single", last: null, lastHypeKey: "" };
const $ = (id) => document.getElementById(id);
const n = (id) => parseFloat(String($(id).value).replace(",", "."));

const hypeMessages = {
  normal: [
    "DU BIST EINE MASCHINE.",
    "HEUTE HAT DER SCHLÄGER GESPROCHEN.",
    "DIE LK WAR NUR EINE ZAHL.",
    "COURT BETRETEN. PUNKTE MITGENOMMEN.",
    "RESPEKTLOS GUT GESPIELT.",
    "SAUBERER SIEG. SAUBERE ARBEIT.",
    "DAS WAR TENNIS MIT ANSAGE.",
    "DER ARM WAR LOCKER. DER GEGNER NICHT.",
    "MATCHPLAN GELESEN. MATCHPLAN ZERLEGT.",
    "HEUTE WAR DER COURT DEIN BÜRO."
  ],
  strong: [
    "LK-RÄUBER AUF FREIEM FUSS.",
    "AB HEUTE NUR NOCH VORHANDSTRAHL.",
    "DER GEGNER HATTE DIE LK. DU HATTEST DIE ANTWORT.",
    "DU WARST HEUTE DAS PROBLEM.",
    "VON WEGEN AUSSENSEITER.",
    "DAS WAR EIN STATEMENT-SIEG.",
    "FAVORIT? NICHT MEHR.",
    "DIE LK-TABELLE MUSS SICH JETZT SETZEN.",
    "DU HAST DEN PLAN NICHT GELESEN. DU WARST DER PLAN.",
    "DER GEGNER KAM MIT LK. DU KAMST MIT LÖSUNG."
  ],
  monster: [
    "DAS WAR KEIN SIEG. DAS WAR EINE DEMONTAGE.",
    "AUF DEM SPIELBERICHT STEHT EIN VERBRECHEN.",
    "DU HAST DIE LK NICHT VERBESSERT. DU HAST SIE ENTFÜHRT.",
    "HEUTE GAB ES NUR OPFER.",
    "DAS WAR EIN LK-ÜBERFALL.",
    "DAS WAR KEIN MATCH. DAS WAR EIN SYSTEMAUSFALL.",
    "DIE RANGLISTE HAT GERADE SCHLUCKAUF.",
    "DAS WAR TENNIS AUS DER ABTEILUNG PROBLEMSTÖRUNG.",
    "DEIN GEGNER SUCHT NOCH DEN ERSTEN RHYTHMUS.",
    "HEUTE WURDE DIE LK-HIERARCHIE NEU SORTIERT.",
    "DAS WAR EIN SPORTLICHER EINBRUCHDIEBSTAHL.",
    "VORHAND, RÜCKHAND, GERICHTSTERMIN.",
    "DU HAST NICHT GEWONNEN. DU HAST VERWALTET.",
    "DAS WAR EINE LK-KORREKTUR MIT GEWALT.",
    "DER COURT BRAUCHT JETZT ERHOLUNG."
  ]
};

function fmt(value, digits = 3) {
  if (typeof value === "string") return value;
  return Number(value).toLocaleString("de-DE", {minimumFractionDigits: digits, maximumFractionDigits: digits});
}
function fmtLK(value) { return Number(value).toLocaleString("de-DE", {minimumFractionDigits: 1, maximumFractionDigits: 1}); }
function round3(x) { return Math.round((x + Number.EPSILON) * 1000) / 1000; }
function truncate1(x) { return Math.trunc(x * 10) / 10; }
function clampLK(x) { return Math.min(25, Math.max(1.5, x)); }
function randomItem(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

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

function ageFactorBase(age, gender) {
  if (age === "open") return 1.0;
  const a = parseInt(age, 10);
  const youthM = {10:.25,11:.30,12:.40,13:.50,14:.60,15:.70,16:.80,17:.90,18:1,21:1};
  const youthW = {10:.30,11:.40,12:.50,13:.60,14:.70,15:.80,16:.90,17:1,18:1,21:1};
  if (a <= 21) return gender === "w" ? youthW[a] : youthM[a];
  if (a >= 30) return Math.max(.30, (120 - a) / 100);
  return 1.0;
}

/*
  Kalibrierung:
  Das bekannte echte Beispiel des Nutzers:
  LK 9,2 gegen LK 6,6, Ü30, Punktspiel => 0,446 Verbesserung.
  Die reine Formel mit bisheriger Senioren-Näherung ergab 0,561.
  Faktor 0,942 liefert 0,446.
*/
function calibrationFactor(age) {
  const a = age === "open" ? 0 : parseInt(age, 10);
  if (a >= 30) return 0.942;
  return 1.0;
}

function validate(values) { return values.every(v => Number.isFinite(v) && v >= 1 && v <= 25); }

function setMode(mode) {
  state.mode = mode;
  $("tab-single").classList.toggle("active", mode === "single");
  $("tab-double").classList.toggle("active", mode === "double");
  $("partnerWrap").classList.toggle("hidden", mode !== "double");
  $("opp2Wrap").classList.toggle("hidden", mode !== "double");
  $("partnerResultWrap").classList.toggle("hidden", mode !== "double");
  $("opp1Label").textContent = mode === "double" ? "Gegner 1 LK" : "Gegner-LK";
  calculate(false);
}

function showHype(diff) {
  let category = "normal";
  if (diff >= 4) category = "monster";
  else if (diff >= 2) category = "strong";
  $("hypeBadge").textContent = diff >= 4 ? "MONSTER-SIEG" : diff >= 2 ? "STARKER SIEG" : "SIEG";
  $("hypeText").textContent = randomItem(hypeMessages[category]);
  $("hype").classList.remove("hidden");
  $("hype").setAttribute("aria-hidden", "false");
  if (navigator.vibrate) navigator.vibrate([120, 80, 180]);
  setTimeout(hideHype, 4200);
}

function hideHype() {
  $("hype").classList.add("hidden");
  $("hype").setAttribute("aria-hidden", "true");
}

function calculate(allowHype = false) {
  const my = n("myLk");
  const partner = n("partnerLk");
  const opp1 = n("opp1Lk");
  const opp2 = n("opp2Lk");
  const age = $("ageClass").value;
  const gender = $("gender").value;
  const ABase = ageFactorBase(age, gender);
  const C = calibrationFactor(age);
  const A = ABase * C;
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
  if (state.mode === "double") {
    teamOwn = (my + partner) / 2;
    teamOpp = (opp1 + opp2) / 2;
  }

  const d = teamOwn - teamOpp;
  const baseP = pointsFunction(d);
  const P = baseP * teamBonus;
  const H = hurdle(teamOwn);
  const improvement = round3(A * Z * P / H * (state.mode === "double" ? 0.5 : 1));

  const newMyComp = round3(clampLK(my - improvement + surcharge));
  const newMyLk = truncate1(newMyComp);

  $("newLk").textContent = fmtLK(newMyLk);
  $("newCompanion").textContent = fmt(newMyComp, 3);
  $("improvement").textContent = fmt(improvement, 3);
  $("points").textContent = fmt(P, 3);

  let newPartnerComp = null, newPartnerLk = null;
  if (state.mode === "double") {
    newPartnerComp = round3(clampLK(partner - improvement + surcharge));
    newPartnerLk = truncate1(newPartnerComp);
    $("partnerResult").textContent = `${fmtLK(newPartnerLk)} / ${fmt(newPartnerComp, 3)}`;
  }

  $("calcLines").textContent =
`${state.mode === "single" ? "Einzel" : "Doppel / Mixed"}
Eigene Team-LK: ${fmt(teamOwn, 3)}
Gegnerische Team-LK: ${fmt(teamOpp, 3)}
LK-Differenz d: ${fmt(d, 3)}

Punktefunktion Basis P: ${fmt(baseP, 3)}
Punktspiel-Bonus: ${teamBonus > 1 ? "ja, × 1,10" : "nein"}
Punkte P: ${fmt(P, 3)}

Hürde H: ${fmt(H, 3)}
Altersklassenfaktor Basis: ${fmt(ABase, 3)}
Kalibrierfaktor Senioren: ${fmt(C, 3)}
verwendeter Faktor A: ${fmt(A, 3)}
Zählweisenfaktor Z: ${fmt(Z, 2)}
${state.mode === "double" ? "Doppel-Verteilung: 50 %\n" : ""}
Verbesserung = A × Z × P / H${state.mode === "double" ? " × 0,5" : ""}
Verbesserung: ${fmt(improvement, 3)}

Neue LK: ${fmtLK(newMyLk)}
Neuer Begleitwert: ${fmt(newMyComp, 3)}
${state.mode === "double" ? `Partner neue LK: ${fmtLK(newPartnerLk)}\nPartner neuer Begleitwert: ${fmt(newPartnerComp, 3)}` : ""}

Referenz:
LK 9,2 gegen 6,6 in Ü30 mit Punktspiel ergibt ca. 0,446.`;

  state.last = {date: new Date().toLocaleString("de-DE"), mode: state.mode === "single" ? "Einzel" : "Doppel / Mixed", age: $("ageClass").selectedOptions[0].textContent, newMyLk, newMyComp, improvement, newPartnerLk, newPartnerComp};

  const upsetDiff = round3(teamOwn - teamOpp);
  const hypeKey = `${state.mode}|${my}|${partner}|${opp1}|${opp2}|${age}|${teamBonus}`;
  if (allowHype && upsetDiff >= 1.5 && state.lastHypeKey !== hypeKey) {
    state.lastHypeKey = hypeKey;
    showHype(upsetDiff);
  }
}

function saveResult() {
  calculate(false);
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
    return `<div class="history-item"><b>${item.mode}: neue LK ${fmtLK(item.newMyLk)}${partner}</b><span>${item.date} · ${item.age} · Verbesserung ${fmt(item.improvement,3)}</span></div>`;
  }).join("");
}

function reset() {
  $("myLk").value = "9.200";
  $("partnerLk").value = "18.294";
  $("opp1Lk").value = "6.600";
  $("opp2Lk").value = "10.600";
  $("ageClass").value = "30";
  $("gender").value = "m";
  $("scoring").value = "1";
  $("teamMatch").checked = true;
  $("weeklySurcharge").checked = false;
  state.lastHypeKey = "";
  setMode("single");
}

["myLk","partnerLk","opp1Lk","opp2Lk","ageClass","gender","scoring","teamMatch","weeklySurcharge"].forEach(id => {
  $(id).addEventListener("input", () => calculate(false));
  $(id).addEventListener("change", () => calculate(false));
});
$("tab-single").addEventListener("click", () => setMode("single"));
$("tab-double").addEventListener("click", () => setMode("double"));
$("calcBtn").addEventListener("click", () => calculate(true));
$("saveBtn").addEventListener("click", saveResult);
$("resetBtn").addEventListener("click", reset);
$("clearHistoryBtn").addEventListener("click", () => { localStorage.removeItem("lkHistory"); renderHistory(); });
$("hypeClose").addEventListener("click", hideHype);
$("hype").addEventListener("click", (e) => { if (e.target.id === "hype") hideHype(); });

calculate(false);
renderHistory();
