
const hypeTexts = [
"DU BIST EINE MASCHINE.",
"AB HEUTE NUR NOCH VORHANDSTRAHL.",
"LK‑RÄUBER AUF FREIEM FUSS.",
"DAS WAR EIN LK‑ÜBERFALL.",
"HEUTE GAB ES NUR OPFER.",
"RESPEKTLOS GUT GESPIELT.",
"DIE LK WAR NUR EINE ZAHL.",
"DER GEGNER HATTE DIE LK. DU HATTEST DIE ANTWORT.",
"HEUTE HAT DER SCHLÄGER GESPROCHEN.",
"AUF DEM SPIELBERICHT STEHT EIN VERBRECHEN.",
"DU WARST HEUTE DAS PROBLEM.",
"DAS WAR KEIN SIEG. DAS WAR EINE DEMONTAGE.",
"COURT BETRETEN. PUNKTE MITGENOMMEN.",
"VON WEGEN AUSSENSEITER.",
"DU HAST DIE LK NICHT VERBESSERT. DU HAST SIE ENTFÜHRT."
];

let mode = "single";

const singleBtn = document.getElementById("singleBtn");
const doubleBtn = document.getElementById("doubleBtn");

singleBtn.onclick = () => {
  mode="single";
  singleBtn.classList.add("active");
  doubleBtn.classList.remove("active");
  document.getElementById("partnerWrap").classList.add("hidden");
  document.getElementById("opp2Wrap").classList.add("hidden");
};

doubleBtn.onclick = () => {
  mode="double";
  doubleBtn.classList.add("active");
  singleBtn.classList.remove("active");
  document.getElementById("partnerWrap").classList.remove("hidden");
  document.getElementById("opp2Wrap").classList.remove("hidden");
};

function rnd(arr){
  return arr[Math.floor(Math.random()*arr.length)];
}

function showHype(diff){
  const hype = document.getElementById("hype");
  const badge = document.getElementById("hypeBadge");
  badge.innerText = diff >= 4 ? "MONSTER‑SIEG" : diff >= 2 ? "STARKER SIEG" : "SIEG";
  document.getElementById("hypeText").innerText = rnd(hypeTexts);
  hype.classList.remove("hidden");
  hype.setAttribute("aria-hidden","false");

  if(navigator.vibrate){
    navigator.vibrate([120,80,180]);
  }

  setTimeout(()=>{
    hype.classList.add("hidden");
    hype.setAttribute("aria-hidden","true");
  },4000);
}

document.getElementById("hype").onclick = () => {
  document.getElementById("hype").classList.add("hidden");
};

document.getElementById("calcBtn").onclick = () => {
  const my = parseFloat(document.getElementById("myLk").value);
  const opp = parseFloat(document.getElementById("opp1").value);

  if(!Number.isFinite(my) || !Number.isFinite(opp)){
    alert("Bitte gültige LK-Werte eingeben.");
    return;
  }

  const diff = my - opp;

  let gain = Math.max(0.12, ((my - opp + 2.5) / 10));
  if(document.getElementById("bonus").checked){
    gain *= 1.1;
  }
  gain = Math.round(gain * 1000) / 1000;

  const newLk = Math.max(1, my - gain).toFixed(1);

  document.getElementById("result").innerText = newLk;
  document.getElementById("improvement").innerText = "Verbesserung +" + gain.toFixed(3);

  if(diff >= 1.5){
    showHype(diff);
  }
};
