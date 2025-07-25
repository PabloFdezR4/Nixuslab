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
    let solText = await solRes.text();
    let valText = await valRes.text();
    // Eliminar BOM (UTF-8) y retornos de carro
    solText = solText.replace(/^\uFEFF/, '').replace(/\r/g, '');
    valText = valText.replace(/^\uFEFF/, '').replace(/\r/g, '');

    function normalize(word) {
      // Corregir encoding erróneo de 'ñ' y quitar tildes
      word = word.replace(/├▒/g, 'ñ');
      let normalized = word
        .toLowerCase()
        .replace(/ñ/g, 'n~')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/n~/g, 'ñ');
      return normalized.toUpperCase();
    }

    // Lista de soluciones: palabras comunes de 5 letras
    palabrasSoluciones = solText
      .split(/\n+/)
      .map(w => normalize(w.trim()))
      .filter(w => /^[A-ZÑ]{5}$/.test(w));

    // Lista amplia de válidas: todas las de 5 letras
    palabrasValidas = valText
      .split(/\n+/)
      .map(w => normalize(w.trim()))
      .filter(w => /^[A-ZÑ]{5}$/.test(w));

    // Escoger palabra solución aleatoria
    solution = palabrasSoluciones[
      Math.floor(Math.random() * palabrasSoluciones.length)
    ];
  } catch (err) {
    console.error('Error cargando listas:', err);
  }
}

// Inicializar carga
loadWordLists();

// ---- Variables del juego ----
const maxAttempts = 6;
let currentAttempt = 0;
let currentGuess = "     ";
let gameOver = false;
let selectedCell = 0;

// Constantes de animación
const ANIMATION_DURATION = 180;
const REBOTE_DURATION = 120;
const STAGGER_DELAY = 20;

// ---- Construcción del tablero ----
const board = document.getElementById('board');
for (let i = 0; i < maxAttempts; i++) {
  const row = document.createElement('div');
  row.classList.add('row');
  for (let j = 0; j < 5; j++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    const front = document.createElement('div'); front.className = 'cell-front';
    const back = document.createElement('div');  back.className = 'cell-back';
    cell.append(front, back);
    row.appendChild(cell);
  }
  board.appendChild(row);
}
updateCurrentRow();

// ---- Mensajes ----
const messageDiv = document.getElementById('message');
function showMessage(msg) {
  messageDiv.textContent = msg;
  if (!gameOver) setTimeout(() => messageDiv.textContent = '', 2000);
}

// ---- Evaluación ----
function evaluateGuess(guess) {
  const result = Array(5).fill('absent');
  const solArr = solution.split('');
  const guessArr = guess.split('');
  // Marca correctas
  guessArr.forEach((ltr, i) => {
    if (ltr === solArr[i]) {
      result[i] = 'correct';
      solArr[i] = null;
    }
  });
  // Marca presentes
  guessArr.forEach((ltr, i) => {
    if (result[i] !== 'correct') {
      const idx = solArr.indexOf(ltr);
      if (idx !== -1) { result[i] = 'present'; solArr[idx] = null; }
    }
  });
  return result;
}

// ---- Validación de palabra ----
function isValidWord(word) {
  return /^[A-ZÑ]{5}$/.test(word) && palabrasValidas.includes(word);
}

// ---- Actualizar interfaz ----
function updateBoard(guess, evaluation) {
  const cells = board.children[currentAttempt].querySelectorAll('.cell');
  cells.forEach((cell, i) => {
    cell.textContent = guess[i] || '';
    if (evaluation) cell.classList.add(evaluation[i]);
  });
}

function updateKeyboard(guess, evaluation) {
  guess.split('').forEach((ltr, i) => {
    document.querySelectorAll(`.key[data-key="${ltr}"]`).forEach(btn => {
      if (!btn.classList.contains('correct')) btn.classList.add(evaluation[i]);
    });
  });
}

function updateCurrentRow() {
  const row = board.children[currentAttempt];
  const cells = row.querySelectorAll('.cell');
  cells.forEach(c => c.classList.remove('current'));
  cells.forEach((cell, i) => {
    const front = cell.querySelector('.cell-front');
    front.textContent = currentGuess[i] === ' ' ? '' : currentGuess[i];
  });
  if (selectedCell < 5) cells[selectedCell].classList.add('current');
}

// ---- Eventos ----
board.querySelectorAll('.cell').forEach((cell, idx) => {
  cell.onclick = () => {
    if (!gameOver && idx == currentAttempt * 5 + selectedCell) {
      updateCurrentRow();
    }
  }
});

document.querySelectorAll('.key').forEach(btn =>
  btn.addEventListener('click', () => handleKey(btn.dataset.key))
);

// Teclado físico
document.addEventListener('keydown', e => {
  const k = e.key.toUpperCase();
  if (k === 'ENTER') handleKey('tick');
  else if (k === 'BACKSPACE') handleKey('⌫');
  else if (/^[A-ZÑ]$/.test(k)) handleKey(k);
});

async function handleKey(key) {
  if (gameOver) return;
  if (key === 'tick') {
    const attempt = currentGuess.replace(/\s+/g, '');
    if (attempt.length < 5) return showMessage('La palabra debe tener 5 letras');
    if (!isValidWord(attempt)) return showMessage('Palabra no válida');
    const evalRes = evaluateGuess(attempt);
    // Animación de celdas
    const cells = board.children[currentAttempt].querySelectorAll('.cell');
    for (let i = 0; i < 5; i++) {
      cells[i].classList.add('shine','flip');
      await new Promise(r => setTimeout(r, ANIMATION_DURATION));
      cells[i].classList.remove('flip');
      cells[i].classList.add(evalRes[i],'bounce');
      await new Promise(r => setTimeout(r, REBOTE_DURATION));
      cells[i].classList.remove('bounce','shine');
    }
    updateKeyboard(attempt, evalRes);
    if (evalRes.every(v => v === 'correct')) return showMessage('¡Has ganado!');
    currentAttempt++;
    if (currentAttempt >= maxAttempts) {
      showMessage(`Game over. Era: ${solution}`);
      gameOver = true;
      return;
    }
    currentGuess = '     ';
    selectedCell = 0;
    updateCurrentRow();
  } else if (key === '⌫') {
    const arr = currentGuess.split('');
    const pos = Math.max(0, selectedCell - 1);
    arr[pos] = ' ';
    currentGuess = arr.join('');
    selectedCell = pos;
    updateCurrentRow();
  } else if (/^[A-ZÑ]$/.test(key) && selectedCell < 5) {
    const arr = currentGuess.split('');
    arr[selectedCell] = key;
    currentGuess = arr.join('');
    selectedCell = Math.min(5, selectedCell + 1);
    updateCurrentRow();
  }
}
