// Lista de palabras válidas
const palabrasValidas = [
  "SEÑAL", "FLOJO", "DULCE", "CALMA", "HACER", "MADUR", "CULPA", "NIEVE", "HAMBR", "OCULT", 
  "TIEM", "CAUSA", "NACER", "UNICA", "VARIO", "CIELO", "CRUCE", "HABER", "RAPID", "ETILO", 
  "EXPER", "ANIMO", "ACIDO", "CUERO", "DEFEN", "FAVOR", "FUERT", "GRAND", "INFLU", "REBUS", 
  "ACTUA", "HABLA", "LETRA", "PONER", "ANGEL", "CASAR", "IDIOM", "INCRE", "MEJOR", "ORILL", 
  "BURRO", "SIMP", "TALEN", "LUCIR", "COLON", "FUERA", "ELEGIR", "MADER", "OLVID", "URGEN", 
  "LARGO", "VISUA", "ZAFIR", "DOBLE", "FIEST", "CAMPO", "JAMAS", "TRABA", "BUENO", "RIEGO", 
  "ESCOM", "MAGIA", "SUMAR", "AYUDA", "CINCO", "MUCHO", "PAZOS", "ORDEN", "CAIDA", "BISAB", 
  "TIENE", "PATIO", "JUEGO", "TAREA", "ARNES", "ASTRO", "HOGAR", "TRECE", "HACIA", "VIAJE", 
  "GOTAS", "VOCAL", "SABER", "AIREO", "REFLE", "COCHE", "SIGLO", "VENDA", "DEDOS", "RATON", 
  "ESTIR", "TECHO", "GRASA", "LLAMA", "GRUPO", "EJEMP", "SOLAR", "GARGA", "IDEAL", "NATUR"
];

// Variables del juego
const solution = palabrasValidas[Math.floor(Math.random() * palabrasValidas.length)];
const maxAttempts = 6;
let currentAttempt = 0;
let currentGuess = "     ";
let gameOver = false;
let selectedCell = 0;

// Constantes de animación
const ANIMATION_DURATION = 180; // 0.18 segundos para flip
const REBOTE_DURATION = 120; // 0.12 segundos para rebote
const STAGGER_DELAY = 20; // 0.02 segundos entre cada celda

// Inicializar el tablero
const board = document.getElementById("board");
for (let i = 0; i < maxAttempts; i++) {
  const row = document.createElement("div");
  row.classList.add("row");
  for (let j = 0; j < 5; j++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    // Caras para flip 3D
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

// Funciones de utilidad
const messageDiv = document.getElementById("message");
function showMessage(msg) {
  messageDiv.textContent = msg;
  if (!gameOver) {
    setTimeout(() => {
      messageDiv.textContent = "";
    }, 2000);
  }
}

function evaluateGuess(guess) {
  const result = Array(5).fill("absent");
  const solArr = solution.split("");
  const guessArr = guess.split("");
  
  // Primero marcar correct
  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === solArr[i]) {
      result[i] = "correct";
      solArr[i] = null;
    }
  }
  // Luego marcar present
  for (let i = 0; i < 5; i++) {
    if (result[i] === "correct") continue;
    const idx = solArr.indexOf(guessArr[i]);
    if (idx !== -1) {
      result[i] = "present";
      solArr[idx] = null;
    }
  }
  return result;
}

function isValidWord(word) {
  return word.length === 5 && /^[A-ZÑ]{5}$/.test(word);
}

function updateBoard(guess, evaluation) {
  const rows = document.querySelectorAll(".row");
  const cells = rows[currentAttempt].querySelectorAll(".cell");
  for (let i = 0; i < 5; i++) {
    cells[i].textContent = guess[i] || "";
    if (evaluation) {
      cells[i].classList.add(evaluation[i]);
    }
  }
}

function updateKeyboard(guess, evaluation) {
  guess.split("").forEach((letter, index) => {
    const keyButtons = document.querySelectorAll(`.key[data-key="${letter}"]`);
    keyButtons.forEach(button => {
      if (button.classList.contains("correct")) return;
      if (evaluation[index] === "correct") {
        button.classList.remove("present", "absent");
        button.classList.add("correct");
      } else if (evaluation[index] === "present") {
        if (!button.classList.contains("present") && !button.classList.contains("correct")) {
          button.classList.add("present");
        }
      } else if (evaluation[index] === "absent") {
        if (!button.classList.contains("present") && !button.classList.contains("correct")) {
          button.classList.add("absent");
        }
      }
    });
  });
}

function updateCurrentRow() {
  const rows = document.querySelectorAll(".row");
  const cells = rows[currentAttempt].querySelectorAll(".cell");
  cells.forEach(cell => cell.classList.remove("current"));
  for (let i = 0; i < 5; i++) {
    const letter = currentGuess[i];
    const front = cells[i].querySelector('.cell-front');
    const back = cells[i].querySelector('.cell-back');
    if (front) front.textContent = letter === " " ? "" : letter;
    if (back) back.textContent = letter === " " ? "" : letter;
  }
  if (selectedCell < 5) {
    cells[selectedCell].classList.add("current");
  }
}

// Eventos de clic en las celdas
const rows = document.querySelectorAll(".row");
rows.forEach((row, rowIndex) => {
  const cells = row.querySelectorAll(".cell");
  cells.forEach((cell, cellIndex) => {
    cell.addEventListener("click", () => {
      if (rowIndex === currentAttempt && !gameOver) {
        selectedCell = cellIndex;
        updateCurrentRow();
      }
    });
  });
});

// Manejar entrada de teclas
function handleKey(key) {
  if (gameOver) return;
  
  if (key === "tick") {
    currentGuess = currentGuess.replace(/\s+/g, "");
    
    if (currentGuess.length < 5) {
      showMessage("La palabra debe tener 5 letras");
      return;
    }
    if (!isValidWord(currentGuess)) {
      showMessage("Solo se permiten letras (A-Z y Ñ)");
      return;
    }
    
    // Obtener la fila actual
    const currentRow = board.children[currentAttempt];
    const cells = currentRow.querySelectorAll('.cell');
    const evalRes = evaluateGuess(currentGuess);
    
    // Función para animar una celda
    const animateCell = (cell, index) => {
      return new Promise(resolve => {
        cell.classList.remove('flip', 'bounce', 'shine', 'correct', 'present', 'absent');
        const front = cell.querySelector('.cell-front');
        const back = cell.querySelector('.cell-back');
        // Inicial: letra en front, back vacío
        if (front) front.textContent = currentGuess[index] || '';
        if (back) back.textContent = currentGuess[index] || '';
        if (back) back.style.color = '';
        // Añadir el brillo y el flip desde el inicio
        cell.classList.add('shine');
        cell.classList.add('flip');
        // Al terminar el flip, mostrar color y letra en la cara trasera
        setTimeout(() => {
          cell.classList.remove('flip');
          if (evalRes[index] === 'correct') {
            cell.classList.add('correct');
            if (back) {
              back.className = 'cell-back correct';
              back.style.color = 'white';
            }
          } else if (evalRes[index] === 'present') {
            cell.classList.add('present');
            if (back) {
              back.className = 'cell-back present';
              back.style.color = '#222';
            }
          } else {
            cell.classList.add('absent');
            if (back) {
              back.className = 'cell-back absent';
              back.style.color = 'white';
            }
          }
          // Rebote
          cell.classList.add('bounce');
          setTimeout(() => {
            cell.classList.remove('bounce');
            // Quitar el brillo al final de toda la animación
            cell.classList.remove('shine');
            resolve();
          }, REBOTE_DURATION);
        }, ANIMATION_DURATION);
      });
    };
    
    // Animar todas las celdas con un pequeño retraso entre cada una (staggered)
    const animateAllCells = async () => {
      const delays = [0, 60, 120, 180, 240]; // ms
      await Promise.all([
        animateCellWithDelay(cells[0], 0, delays[0]),
        animateCellWithDelay(cells[1], 1, delays[1]),
        animateCellWithDelay(cells[2], 2, delays[2]),
        animateCellWithDelay(cells[3], 3, delays[3]),
        animateCellWithDelay(cells[4], 4, delays[4])
      ]);
      // Después de que todas las celdas se animen
      updateKeyboard(currentGuess, evalRes);
      if (evalRes.every(e => e === "correct")) {
        showMessage("¡Felicidades! Has adivinado la palabra");
        gameOver = true;
        return;
      }
      // Avanzar a la siguiente fila
      currentAttempt++;
      if (currentAttempt >= maxAttempts) {
        showMessage("Game over. La palabra era: " + solution);
        gameOver = true;
        return;
      }
      currentGuess = "     ";
      selectedCell = 0;
      updateCurrentRow();
    };
    // Helper para animar con delay
    function animateCellWithDelay(cell, index, delay) {
      return new Promise(resolve => {
        setTimeout(() => {
          animateCell(cell, index).then(resolve);
        }, delay);
      });
    }
    animateAllCells();
    return;
  } else if (key === "⌫") {
    if (selectedCell === 5) {
      const newGuess = currentGuess.split("");
      newGuess[4] = " ";
      currentGuess = newGuess.join("");
      selectedCell = 4;
      updateCurrentRow();
    } else if (selectedCell > 0) {
      const newGuess = currentGuess.split("");
      newGuess[selectedCell - 1] = " ";
      currentGuess = newGuess.join("");
      selectedCell--;
      updateCurrentRow();
    }
  } else if (selectedCell < 5) {
    const newGuess = currentGuess ? currentGuess.split("") : "     ".split("");
    newGuess[selectedCell] = key;
    currentGuess = newGuess.join("");
    
    selectedCell++;
    if (selectedCell >= 5) {
      selectedCell = 5;
    }
    updateCurrentRow();
  }
}

// Eventos del teclado virtual
document.querySelectorAll('.key').forEach(button => {
  button.addEventListener('click', function() {
    this.classList.add('pressed');
    setTimeout(() => {
      this.classList.remove('pressed');
    }, 100);
    handleKey(this.getAttribute('data-key'));
  });
});

// Eventos del teclado físico
document.addEventListener("keydown", (e) => {
  const key = e.key.toUpperCase();
  if (key === "ENTER") {
    handleKey("tick");
  } else if (key === "BACKSPACE") {
    handleKey("⌫");
  } else if (/^[A-ZÑ]$/.test(key)) {
    handleKey(key);
  }
}); 