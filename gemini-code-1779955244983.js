const bank = window.QUESTION_BANK;

const enemySprites = [
  "enemy-raptor.png",
  "enemy-bird.png",
  "enemy-bandit.png",
  "enemy-beast.png",
  "enemy-boar.png",
  "enemy-cat.png",
  "enemy-slime.png",
  "enemy-croc.png",
  "enemy-wraith.png",
  "enemy-fish.png",
  "enemy-dino.png",
  "enemy-rex.png",
];

const state = {
  phase: "start",
  hp: 100,
  mp: 100,
  gold: 0,
  score: 0,
  enemies: 0,
  battleIndex: 0,
  truthIndex: 0,
  truthPath: null,
  matchIndex: 0,
  guard: false,
  poison: false,
  frost: false,
  inspected: false,
  items: { hp: 0, mp: 0, poison: 0, frost: 0 },
};

const el = {
  hpBar: document.querySelector("#hpBar"),
  mpBar: document.querySelector("#mpBar"),
  hpText: document.querySelector("#hpText"),
  mpText: document.querySelector("#mpText"),
  goldText: document.querySelector("#goldText"),
  enemyText: document.querySelector("#enemyText"),
  scoreText: document.querySelector("#scoreText"),
  title: document.querySelector("#title"),
  message: document.querySelector("#message"),
  options: document.querySelector("#options"),
  world: document.querySelector("#world"),
  enemySprite: document.querySelector("#enemySprite"),
  npcSprite: document.querySelector("#npcSprite"),
  playerSprite: document.querySelector("#playerSprite"),
  escapeBtn: document.querySelector("#escapeBtn"),
  guardBtn: document.querySelector("#guardBtn"),
  inspectBtn: document.querySelector("#inspectBtn"),
};

const itemNames = {
  hp: "HP Potion",
  mp: "MP Potion",
  poison: "Poison Potion",
  frost: "Frost Potion",
};

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

function updateHud() {
  el.hpBar.style.width = `${state.hp}%`;
  el.mpBar.style.width = `${state.mp}%`;
  el.hpText.textContent = state.hp;
  el.mpText.textContent = state.mp;
  el.goldText.textContent = state.gold;
  el.enemyText.textContent = `${state.enemies}/20`;
  el.scoreText.textContent = Number(state.score.toFixed(1));
  Object.keys(state.items).forEach((key) => {
    document.querySelector(`#${key}Item`).textContent = state.items[key];
  });

  const skillPhase = state.phase === "battle" || state.phase === "truth" || state.phase === "final";
  const inspectLocked = state.phase === "truth" || state.phase === "final";
  el.escapeBtn.disabled = state.mp < 20 || !skillPhase;
  el.guardBtn.disabled = state.mp < 20 || !skillPhase;
  el.inspectBtn.disabled = state.mp < 20 || !skillPhase || inspectLocked || state.inspected;
}

function setScene({ enemy = false, npc = "", shop = false } = {}) {
  el.enemySprite.classList.toggle("hidden", !enemy);
  el.npcSprite.classList.toggle("hidden", !npc && !shop);
  if (enemy) {
    const sprite = enemySprites[state.enemies % enemySprites.length];
    el.enemySprite.src = `${sprite}`;
    el.enemySprite.alt = "Enemy sprite";
  }
  if (shop) {
    el.npcSprite.src = "shopkeeper.png";
    el.npcSprite.alt = "Shopkeeper sprite";
  } else if (npc) {
    el.npcSprite.src = `${npc}`;
    el.npcSprite.alt = "NPC sprite";
  }
}

function setBackground(scene = "forest") {
  el.world.classList.toggle("truth-bg", scene === "truth");
  el.world.classList.toggle("final-bg", scene === "final");
}

function panel(title, message, buttons = []) {
  el.title.textContent = title;
  el.message.innerHTML = message;
  el.options.innerHTML = "";
  buttons.forEach((button) => {
    const node = document.createElement("button");
    node.innerHTML = button.label;
    node.className = button.className || "";
    node.disabled = Boolean(button.disabled);
    node.addEventListener("click", button.action);
    el.options.appendChild(node);
  });
  updateHud();
}

function formatDialogue(line) {
  if (typeof line === "string") return line;
  return line.speaker ? `<strong>${line.speaker}:</strong> ${line.text}` : line.text;
}

function showDialogue(title, lines, index, onDone) {
  state.phase = "dialogue";
  const isLast = index >= lines.length - 1;
  panel(title, formatDialogue(lines[index]), [
    {
      label: "Lanjut",
      action: () => (isLast ? onDone() : showDialogue(title, lines, index + 1, onDone)),
    },
  ]);
}

function resetGame() {
  Object.assign(state, {
    phase: "start",
    hp: 100,
    mp: 100,
    gold: 0,
    score: 0,
    enemies: 0,
    battleIndex: 0,
    truthIndex: 0,
    truthPath: null,
    matchIndex: 0,
    guard: false,
    poison: false,
    frost: false,
    inspected: false,
    items: { hp: 2, mp: 2, poison: 0, frost: 0 },
  });
  setScene({ npc: "" });
  startScreen();
}

function startScreen() {
  state.phase = "start";
  setBackground();
  setScene();
  panel(
    "Accounting rpg",
    "Start",
    [{ label: "Start Journey", action: () => tutorial() }]
  );
}

function tutorial(step = 0) {
  state.phase = "tutorial";
  setBackground();
  setScene({ npc: "grandfather.png" });
  const lines = [
    { speaker: "NPC", text: "kau mau kemana pagi-pagi Dim" },
    { speaker: "Player", text: "Aku mau pergi ke kota kek, sedang ada ujian perekrutan untuk akuntan" },
    { speaker: "NPC", text: "oh kau ingin pergi ke kota, sebelum berangkat ada beberapa hal yang perlu kamu ketahui" },
    "terdapat 2 bar di atas kiri, yang pertama bar HP jika kau bertemu dengan musuh dan gagal menjawab pertanyaan mereka HP mu akan berkurang dan jika HP mu mencapai nol maka kau akan kalah",
    "Selanjutnya di bawah HP ada MP, MP bisa digunakan untuk mengaktifkan skill, skill dapat membantu dalam pertempuran",
    "Selanjutnya di bawah lagi ada kantong emas mu kamu bisa menggunakannya saat ada toko di perjalanan mu. kamu bisa mendapat emas saat mengalahkan musuh",
    "contoh pada skill di bawah, escape dapat melewati pertanyaan tapi kamu tidak akan dapat poin, Guard dapat menangkis serangan musuh agar HP mu tidak berkurang dan inspek akan meng eliminasi pilihan salah dalam pertempuran",
    "yang terakhir ada inventory, kau dapat menyimpan dan menggunakan beberapa barang yang akan berguna di perjalanan",
    "itu aku memberikan 2 item. HP potion dan MP potion. gunakan mereka jika MP atau HP mu rendah",
    { speaker: "Player", text: "terimakasih kek aku segera berangkat" },
    { speaker: "NPC", text: 'Ya hati hati di jalan. selama di jalan kamu bisa membaca buku ini ini akan membantu ujian mu<br><a href="https://canva.link/eb9n58u8j2s2d4o" target="_blank" rel="noopener">Buka buku panduan</a>' },
  ];
  const last = step >= lines.length - 1;
  panel("Tutorial Awal Desa", formatDialogue(lines[step]), [
    { label: last ? "Pergi ke jalan kota" : "Lanjut", action: () => (last ? beginBattle() : tutorial(step + 1)) },
  ]);
}

function beginBattle() {
  state.phase = "battle";
  setBackground();
  state.inspected = false;
  setScene({ enemy: true });
  showBattleQuestion();
}

function showBattleQuestion(note = "") {
  state.phase = "battle";
  state.inspected = false;
  if (state.battleIndex >= bank.multipleChoice.length) {
    openShop("first");
    return;
  }
  const q = bank.multipleChoice[state.battleIndex];
  const enemyNo = Math.floor(state.battleIndex / 2) + 1;
  const choices = q.choices.map((choice) => ({
    label: `<span class="pill">${choice.key}.</span> ${choice.text}`,
    className: "choice",
    action: () => answerBattle(choice.key),
  }));
  panel(
    `Battle ${enemyNo}/20 - Soal ${state.battleIndex + 1}/40`,
    `${note}${q.question}`,
    choices
  );
}

function answerBattle(key, skipped = false) {
  const q = bank.multipleChoice[state.battleIndex];
  if (!skipped && key === q.answer) {
    state.score += 1.5;
    advanceBattle(`<span class="notice">Benar. +1.5 poin.</span><br>`);
    return;
  }
  if (!skipped) {
    takeDamage(15);
  }
  advanceBattle(skipped ? `<span class="bad">Soal dilewati. Tidak ada poin.</span><br>` : `<span class="bad">Salah. Jawaban benar: ${q.answer}.</span><br>`);
}

function advanceBattle(note) {
  state.battleIndex += 1;
  if (state.battleIndex % 2 === 0) {
    state.enemies += 1;
    const drop = Math.floor(Math.random() * 3) + 5;
    state.gold += drop;
    note += `<span class="notice">Musuh kalah dan menjatuhkan ${drop} emas.</span><br>`;
  }
  if (checkGameOver()) return;
  setScene({ enemy: true });
  showBattleQuestion(note);
}

function openShop(which, withIntro = true) {
  if (withIntro) {
    showShopDialogue(which);
    return;
  }
  state.phase = "shop";
  setBackground();
  setScene({ shop: true });
  const items = [
    ["hp", "hp-potion.png", "Restore +20 HP"],
    ["mp", "mp-potion.png", "Restore +20 MP"],
    ["poison", "poison-potion.png", "Damage musuh -50% untuk serangan berikutnya"],
    ["frost", "frost-potion.png", "Musuh tidak menyerang 1 turn"],
  ];
  el.title.textContent = which === "first" ? "Shop Unlocked" : "Second Shop";
  el.message.innerHTML = "Semua item seharga <span class='pill'>25 emas</span>. Tutup toko untuk melanjutkan perjalanan.";
  el.options.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "shop-grid wide";
  items.forEach(([key, img, desc]) => {
    const box = document.createElement("div");
    box.className = "shop-item";
    box.innerHTML = `<img src="${img}" alt=""><strong>${itemNames[key]}</strong><span>${desc}</span>`;
    const buy = document.createElement("button");
    buy.textContent = "Buy 25 Gold";
    buy.disabled = state.gold < 25;
    buy.addEventListener("click", () => {
      if (state.gold < 25) return;
      state.gold -= 25;
      state.items[key] += 1;
      panel("Toko Item", "<strong>Penjual:</strong> terimakasih telah membeli", [
        { label: "Kembali ke toko", action: () => openShop(which, false) },
      ]);
    });
    box.appendChild(buy);
    grid.appendChild(box);
  });
  el.options.appendChild(grid);
  const close = document.createElement("button");
  close.className = "wide";
  close.textContent = "Close Shop";
  close.addEventListener("click", () => closeShop(which));
  el.options.appendChild(close);
  updateHud();
}

function showShopDialogue(which) {
  setBackground();
  setScene({ shop: true });
  showDialogue(
    "Toko Item",
    [
      { speaker: "Penjual", text: "selamat datang ke toko ku semuanya serba murah" },
      { speaker: "Penjual", text: "selamat datang ke toko ku semuanya serba 25 emas" },
      { speaker: "Penjual", text: "aku menjual MP potion yang memulihkan MP sebesar +20, HP potion memulihkan HP sebesar +20, poison potion yang mengurangi damage musuh, dan Ramuan Frost membuat musuh tidak dapat menyerang 1 kali" },
      "Racun — Mengurangi kerusakan yang diberikan musuh jika salah menjawab sebesar 50%",
      "Ramuan Mana — Memulihkan MP sebesar +20",
      "Ramuan Pemulihan — Memulihkan HP sebesar +20",
      "Ramuan Frost — Membuat musuh tidak dapat menyerang 1 kali",
    ],
    0,
    () => openShop(which, false)
  );
}

function closeShop(which) {
  setBackground();
  setScene({ shop: true });
  showDialogue("Toko Item", [{ speaker: "Penjual", text: "sampai jumpa lagi" }], 0, () => (which === "first" ? truthGateIntro() : finalIntro()));
}

function truthGateIntro() {
  state.phase = "gate";
  setBackground("truth");
  setScene({ npc: "truth-gate-enemy.png" });
  showDialogue(
    "Truth Gate",
    [
      "Peserta didik menjawab benar salah suatu pertanyaan",
      "skill inspek tidak dapat digunakan",
      { speaker: "Penjaga", text: "berhenti untuk apa kau ingin melewati gerbang ini" },
      { speaker: "Player", text: "aku ingin ke kota untuk mengikuti ujian perekrutan akuntan" },
      { speaker: "Penjaga", text: "bagaimana kami tau kau bukan penjahat" },
      { speaker: "Penjaga", text: "kau ikut kami interogasi dulu jika ingin lewat" },
    ],
    0,
    showTruthChoice
  );
}

function showTruthChoice() {
  state.phase = "gate";
  setBackground("truth");
  setScene({ npc: "truth-gate-enemy.png" });
  panel("Pilihan", "Pilih tindakanmu di depan gerbang.", [
    { label: "Ikut Interogasi", action: () => beginTruth("safe") },
    { label: "Terobos", action: () => beginTruth("risky") },
  ]);
}

function beginTruth(path) {
  state.phase = "truth";
  setBackground("truth");
  state.truthPath = path;
  state.truthIndex = 0;
  const intro = path === "safe"
    ? "baik karna kamu mengikuti perintah kami kamu hanya perlu menjawab 5 pertanyaan"
    : "Hei berani beraninya kau mau menerobos jika kamu tidak ingin kami tangkap kamu perlu menjawab 10 pertanyaan";
  panel(path === "safe" ? "Scenario 1 — Interogasi" : "Scenario 2 — Terobos", intro, [
    { label: "Mulai Pertanyaan", action: () => showTruth() },
  ]);
}

function showTruth(note = "") {
  const max = state.truthPath === "safe" ? 5 : 10;
  if (state.truthIndex >= max) {
    afterTruthGate();
    return;
  }
  const q = bank.truthFalse[state.truthIndex];
  panel(`Pertanyaan ${state.truthIndex + 1}/${max}`, `${note}${q.statement}`, [
    { label: "Benar", className: "choice", action: () => answerTruth("B") },
    { label: "Salah", className: "choice", action: () => answerTruth("S") },
  ]);
}

function answerTruth(key, skipped = false) {
  const q = bank.truthFalse[state.truthIndex];
  let note = "";
  if (!skipped && key === q.answer) {
    const points = state.truthPath === "safe" ? 2 : 1;
    state.score += points;
    note = `<span class="notice">Benar. +${points} poin.</span><br>`;
  } else if (skipped) {
    note = `<span class="bad">Soal dilewati. Tidak ada poin.</span><br>`;
  } else {
    if (state.truthPath === "risky") takeDamage(15);
    note = `<span class="bad">Salah. Jawaban benar: ${q.answer === "B" ? "Benar" : "Salah"}.</span><br>`;
  }
  state.truthIndex += 1;
  if (checkGameOver()) return;
  showTruth(note);
}

function afterTruthGate() {
  setBackground("truth");
  setScene({ npc: "truth-gate-enemy.png" });
  showDialogue(
    "Truth Gate",
    [{ speaker: "Penjaga", text: "terimakasih karna telah menjawab pertanyaan kami kamu bisa lewat" }],
    0,
    cityDialogue
  );
}

function cityDialogue() {
  setBackground();
  setScene({ npc: "shopkeeper.png" });
  showDialogue(
    "Kota Besar",
    [
      { speaker: "Player", text: "wah jadi seperti ini kota besar ini tempat ujiannya dimana ya, aku tanya orang saja" },
      { speaker: "Player", text: "kak maaf mengganggu, apa kamu tau dimana tempat ujian perekrutan akuntan" },
      { speaker: "NPC Kota", text: "oh tinggal lurus ke arah barat dan akan ada gedung besar di sana" },
      { speaker: "Player", text: "terima kasih kak" },
    ],
    0,
    () => openShop("second")
  );
}

function finalIntro() {
  setBackground("final");
  setScene({ npc: "final-test-examiner.png" });
  showDialogue(
    "Final Test",
    [
      "Peserta didik mencocokan pertanyaan dan jawabannya bila salah mencocokan akan mengurangi HP",
      "skill inspek juga tidak dapat digunakan",
      "apa semua sudah siap",
      "kalau sudah siap, mari kita mulai ujiannya",
      "akan ada 10 soal",
    ],
    0,
    beginFinal
  );
}

function beginFinal() {
  state.phase = "final";
  setBackground("final");
  state.matchIndex = 0;
  setScene({ npc: "final-test-examiner.png" });
  showMatch();
}

function showMatch(note = "") {
  if (state.matchIndex >= bank.matching.length) {
    finishGame();
    return;
  }
  const q = bank.matching[state.matchIndex];
  const options = [...bank.matching]
    .sort((a, b) => a.answerKey.localeCompare(b.answerKey))
    .map((item) => `<option value="${item.answerKey}">${item.answerKey}. ${item.right}</option>`)
    .join("");
  el.title.textContent = `Final Test ${state.matchIndex + 1}/10`;
  el.message.innerHTML = `${note}Cocokkan: <strong>${q.left}</strong>`;
  el.options.innerHTML = `
    <div class="match-grid wide">
      <select id="matchSelect" aria-label="Jawaban matching">${options}</select>
      <button id="matchSubmit">Submit Match</button>
    </div>
  `;
  document.querySelector("#matchSubmit").addEventListener("click", () => {
    answerMatch(document.querySelector("#matchSelect").value);
  });
  updateHud();
}

function answerMatch(key, skipped = false) {
  const q = bank.matching[state.matchIndex];
  let note = "";
  if (!skipped && key === q.answerKey) {
    state.score += 3;
    note = `<span class="notice">Benar. +3 poin.</span><br>`;
  } else if (skipped) {
    note = `<span class="bad">Match dilewati. Tidak ada poin.</span><br>`;
  } else {
    takeDamage(15);
    note = `<span class="bad">Salah. Jawaban benar: ${q.answerKey}. ${q.right}.</span><br>`;
  }
  state.matchIndex += 1;
  if (checkGameOver()) return;
  showMatch(note);
}

function takeDamage(amount) {
  if (state.guard) {
    state.guard = false;
    return 0;
  }
  if (state.frost) {
    state.frost = false;
    return 0;
  }
  const finalDamage = state.poison ? Math.ceil(amount / 2) : amount;
  state.poison = false;
  state.hp = clamp(state.hp - finalDamage);
  return finalDamage;
}

function checkGameOver() {
  if (state.hp > 0) return false;
  state.phase = "gameover";
  setScene();
  panel("Game Over", "HP kamu habis. Kamu bisa mencoba lagi dari awal.", [{ label: "Restart", action: resetGame }]);
  return true;
}

function finishGame() {
  setScene({ npc: "final-test-examiner.png" });
  const passed = state.score >= 70;
  const points = Number(state.score.toFixed(1));
  const lines = passed
    ? [
        "baik saya akan membagikan hasil nya",
        `kamu mendapat ${points} poin.`,
        "kamu akan mulai dipekerjakan minggu depan",
        "setelah mendapat skor dan tau lulus atau tidak kembali ke starting screen",
      ]
    : [
        `kamu mendapat ${points} poin.`,
        "maaf kamu bisa mencoba lagi lain kali",
        "setelah mendapat skor dan tau lulus atau tidak kembali ke starting screen",
      ];
  showDialogue(
    passed ? "Ending Lulus" : "Ending Tidak Lulus",
    lines,
    0,
    () => {
      state.phase = "result";
      panel(passed ? "Lulus Ujian" : "Belum Lulus", `Skor akhir kamu <strong>${points}/100</strong>.`, [
        { label: "Back to Start", action: resetGame },
      ]);
    }
  );
}

function useSkill(skill) {
  const skillPhase = state.phase === "battle" || state.phase === "truth" || state.phase === "final";
  if (state.mp < 20 || !skillPhase) return;
  if (skill === "inspect" && (state.phase === "truth" || state.phase === "final" || state.inspected)) return;
  state.mp -= 20;
  if (skill === "guard") {
    state.guard = true;
    panel("Guard Ready", "Serangan berikutnya akan ditahan jika jawabanmu salah.", [{ label: "Kembali", action: resumeCurrent }]);
  }
  if (skill === "escape") {
    if (state.phase === "battle") answerBattle(null, true);
    if (state.phase === "truth") answerTruth(null, true);
    if (state.phase === "final") answerMatch(null, true);
  }
  if (skill === "inspect" && state.phase === "battle") {
    state.inspected = true;
    inspectChoice();
  }
  updateHud();
}

function inspectChoice() {
  const q = bank.multipleChoice[state.battleIndex];
  const wrong = q.choices.filter((choice) => choice.key !== q.answer);
  const removed = wrong[Math.floor(Math.random() * wrong.length)];
  [...el.options.querySelectorAll("button")].forEach((button) => {
    if (button.textContent.trim().startsWith(`${removed.key}.`)) {
      button.disabled = true;
      button.innerHTML += "<small>Eliminated</small>";
    }
  });
}

function resumeCurrent() {
  if (state.phase === "battle") showBattleQuestion();
  else if (state.phase === "truth") showTruth();
  else if (state.phase === "final") showMatch();
  else startScreen();
}

function useItem(key) {
  if (!state.items[key]) return;
  state.items[key] -= 1;
  if (key === "hp") state.hp = clamp(state.hp + 20);
  if (key === "mp") state.mp = clamp(state.mp + 20);
  if (key === "poison") state.poison = true;
  if (key === "frost") state.frost = true;
  updateHud();
}

document.querySelectorAll("[data-skill]").forEach((button) => {
  button.addEventListener("click", () => useSkill(button.dataset.skill));
});

document.querySelectorAll("[data-item]").forEach((button) => {
  button.addEventListener("click", () => useItem(button.dataset.item));
});

resetGame();