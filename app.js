const state = { mode: "single", last: null };

const hypeMessages = {
  normal: [
    "DU BIST EINE MASCHINE.",
    "HEUTE HAT DER SCHLÄGER GESPROCHEN.",
    "DIE LK WAR NUR EINE ZAHL.",
    "COURT BETRETEN. PUNKTE MITGENOMMEN.",
    "RESPEKTLOS GUT GESPIELT."
  ],
  strong: [
    "LK-RÄUBER AUF FREIEM FUSS.",
    "AB HEUTE NUR NOCH VORHANDSTRAHL.",
    "DER GEGNER HATTE DIE LK. DU HATTEST DIE ANTWORT.",
    "DU WARST HEUTE DAS PROBLEM.",
    "VON WEGEN AUSSENSEITER."
  ],
  monster: [
    "DAS WAR KEIN SIEG. DAS WAR EINE DEMONTAGE.",
    "AUF DEM SPIELBERICHT STEHT EIN VERBRECHEN.",
    "DU HAST DIE LK NICHT VERBESSERT. DU HAST SIE ENTFÜHRT.",
    "HEUTE GAB ES NUR OPFER.",
    "DAS WAR EIN LK-ÜBERFALL."
  ]
};

function randomItem(arr){
  return arr[Math.floor(Math.random()*arr.length)];
}

function triggerHype(diff){
  let text = randomItem(hypeMessages.normal);

  if(diff >= 4){
    text = randomItem(hypeMessages.monster);
  } else if(diff >= 2){
    text = randomItem(hypeMessages.strong);
  }

  const overlay = document.createElement("div");
  overlay.className = "hype-overlay";
  overlay.innerHTML = `
    <div class="hype-box">
      <div class="hype-badge">${diff >= 4 ? "MONSTER-SIEG" : diff >= 2 ? "STARKER SIEG" : "SIEG"}</div>
      <div class="hype-text">${text}</div>
    </div>
  `;

  document.body.appendChild(overlay);

  if (navigator.vibrate) {
    navigator.vibrate([120, 80, 180]);
  }

  setTimeout(() => overlay.classList.add("show"), 20);

  setTimeout(() => {
    overlay.classList.remove("show");
    setTimeout(() => overlay.remove(), 500);
  }, 4200);
}


triggerHype(2.5);
