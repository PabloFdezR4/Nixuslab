// Carga de listas y selección de solución
let solution = "";
let palabrasSoluciones = [];
let palabrasValidas = [];

async function loadWordLists() {
  try {
    const [solRes, valRes] = await Promise.all([
      fetch('solutions_es.txt'),
      fetch('palabras_de_cinco_letras.txt')
    ]);
    const solText = await solRes.text();
    const valText = await valRes.text();

    function normalize(word) {
      // Corregir mal encoding de ñ y quitar tildes
      word = word.replace(/├▒/g, 'ñ');
      let tmp = word
        .toLowerCase()
        .replace(/ñ/g, 'n~')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/n~/g, 'ñ');
      return tmp.toUpperCase();
    }

    palabrasSoluciones = solText
      .split(/\r?\n/)
      .map(w => normalize(w.trim()))
      .filter(w => /^[A-ZÑ]{5}$/.test(w));

    palabrasValidas = valText
      .split(/\r?\n/)
      .map(w => normalize(w.trim()))
      .filter(w => /^[A-ZÑ]{5}$/.test(w));

    // Elegir solución de la lista común
    solution = palabrasSoluciones[
      Math.floor(Math.random() * palabrasSoluciones.length)
    ];
  } catch (err) {
    console.error('Error cargando listas:', err);
  }
}

// Iniciamos la carga nada más cargar el script
loadWordLists();

// Variables del juego
const maxAttempts = 6;
let currentAttempt = 0;
let currentGuess = "     ";
let gameOver = false;
let selectedCell = 0;

// Constantes de animación
const ANIMATION_DURATION = 180;
const REBOTE_DURATION = 120;
const STAGGER_DELAY = 20;

// Construcción del tablero
const board = document.getElementById("board");
for (let i = 0; i < maxAttempts; i++) {
  const row = document.createElement("div");
  row.classList.add("row");
  for (let j = 0; j < 5; j++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    const front = document.createElement("div");
    front.className = "cell-front";
    const back = document.createElement("div");
    back.className = "cell-back";
    cell.appendChild(front);
    cell.appendChild(back);
    row.appendChild(cell);
  }
  board.appendChild(row);
}
updateCurrentRow();

// Mensajes al usuario
const messageDiv = document.getElementById("message");
function showMessage(msg) {
  messageDiv.textContent = msg;
  if (!gameOver) setTimeout(() => { messageDiv.textContent = ""; }, 2000);
}

// Evaluar intento
function evaluateGuess(guess) {
  const result = Array(5).fill("absent");
  const solArr = solution.split("");
  const guessArr = guess.split("");
  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === solArr[i]) {
      result[i] = "correct";
      solArr[i] = null;
    }
  }
  for (let i = 0; i < 5; i++) {
    if (result[i] !== "correct") {
      const idx = solArr.indexOf(guessArr[i]);
      if (idx !== -1) {
        result[i] = "present";
        solArr[idx] = null;
      }
    }
  }
  return result;
}

// Verificar palabra válida
function isValidWord(word) {
  return /^[A-ZÑ]{5}$/.test(word) && palabrasValidas.includes(word);
}

// Actualizar tablero
function updateBoard(guess, evaluation) {
  const rows = document.querySelectorAll(".row");
  const cells = rows[currentAttempt].querySelectorAll(".cell");
  for (let i = 0; i < 5; i++) {
    cells[i].textContent = guess[i] || "";
    if (evaluation) cells[i].classList.add(evaluation[i]);
  }
}

// Actualizar teclado
function updateKeyboard(guess, evaluation) {
  guess.split("").forEach((letter, idx) => {
    document.querySelectorAll(`.key[data-key="${letter}"]`).forEach(btn => {
      if (btn.classList.contains("correct")) return;
      btn.classList.add(evaluation[idx]);
    });
  });
}

// Resaltar fila actual
function updateCurrentRow() {
  const rows = document.querySelectorAll(".row");
  const cells = rows[currentAttempt].querySelectorAll(".cell");
  cells.forEach(c => c.classList.remove("current"));
  cells.forEach((cell, i) => {
    const front = cell.querySelector('.cell-front');
    const back = cell.querySelector('.cell-back');
    front.textContent = currentGuess[i] === ' ' ? '' : currentGuess[i];
    back.textContent = front.textContent;
  });
  if (selectedCell < 5)
    cells[selectedCell].classList.add("current");
}

// Eventos de celda
document.querySelectorAll('.row').forEach((row, rIdx) => {
  row.querySelectorAll('.cell').forEach((cell, cIdx) => {
    cell.addEventListener('click', () => {
      if (rIdx === currentAttempt && !gameOver) {
        selectedCell = cIdx;
        updateCurrentRow();
      }
    });
  });
});

// Manejador de teclas
async function handleKey(key) {
  if (gameOver) return;
  if (key === "tick") {
    const clean = currentGuess.replace(/\s+/g, "");
    if (clean.length < 5) return showMessage("La palabra debe tener 5 letras");
    if (!isValidWord(clean)) return showMessage("Palabra no válida");
    const currentRow = board.children[currentAttempt];
    const cells = currentRow.querySelectorAll('.cell');
    const evalRes = evaluateGuess(clean);
    // Animaciones...
    for (let i = 0; i < 5; i++) {
      const cell = cells[i];
      cell.classList.add('shine','flip');
      await new Promise(r => setTimeout(r, ANIMATION_DURATION));
      cell.classList.remove('flip');
      cell.classList.add(evalRes[i], 'bounce');
      await new Promise(r => setTimeout(r, REBOTE_DURATION));
      cell.classList.remove('bounce','shine');
    }
    updateKeyboard(clean, evalRes);
    if (evalRes.every(e => e === 'correct')) return showMessage("¡Felicidades!");
    currentAttempt++;
    if (currentAttempt >= maxAttempts) {
      showMessage(`Game over. Era: ${solution}`);
      gameOver = true;
      return;
    }
    currentGuess = "     ";
    selectedCell = 0;
    updateCurrentRow();
  } else if (key === "⌫") {
    let arr = currentGuess.split('');
    const pos = selectedCell > 0 ? selectedCell-1 : 4;
    arr[pos] = ' ';
    currentGuess = arr.join('');
    selectedCell = pos;
    updateCurrentRow();
  } else if (/^[A-ZÑ]$/.test(key) && selectedCell < 5) {
    let arr = currentGuess.split('');
    arr[selectedCell] = key;
    currentGuess = arr.join('');
    selectedCell = Math.min(5, selectedCell+1);
    updateCurrentRow();
  }
}

// Teclado virtual y físico
document.querySelectorAll('.key').forEach(btn => btn.onclick = () => handleKey(btn.dataset.key));
document.addEventListener('keydown', e => {
  const k = e.key.toUpperCase();
  if (k==='ENTER') handleKey('tick');
  else if (k==='BACKSPACE') handleKey('⌫');
  else if (/^[A-ZÑ]$/.test(k)) handleKey(k);
});
