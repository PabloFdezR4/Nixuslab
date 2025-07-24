// Variables para las listas y solución
let solution = "";
let palabrasSoluciones = [];
let palabrasValidas = [];

// Cargar las listas de palabras y escoger la solución
async function loadWordLists() {
  try {
    const [solRes, valRes] = await Promise.all([
      fetch('solutions_es.txt'),
      fetch('palabras_de_cinco_letras.txt')
    ]);
    const solText = await solRes.text();
    const valText = await valRes.text();

    // Normalizar: arreglar "ñ" mal codificado, quitar tildes y pasar a mayúsculas
    function normalize(word) {
      word = word.replace(/├▒/g, 'ñ');      // corrige secuencia mal codificada en el txt
      let tmp = word.toLowerCase().replace(/ñ/g, 'n~'); 
      tmp = tmp.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      tmp = tmp.replace(/n~/g, 'ñ');
      return tmp.toUpperCase();
    }

    palabrasSoluciones = solText.split(/\r?\n/)
      .map(w => normalize(w.trim()))
      .filter(w => w.length === 5 && /^[A-ZÑ]{5}$/.test(w));

    palabrasValidas = valText.split(/\r?\n/)
      .map(w => normalize(w.trim()))
      .filter(w => w.length === 5 && /^[A-ZÑ]{5}$/.test(w));

    // Seleccionar solución solo de las comunes
    solution = palabrasSoluciones[Math.floor(Math.random() * palabrasSoluciones.length)];
  } catch (err) {
    console.error('Error cargando listas de palabras:', err);
  }
}

// Lanzar la carga nada más abrir la página
loadWordLists();

// Resto de variables del juego (sin cambios)
const maxAttempts = 6;
let currentAttempt = 0;
let currentGuess = "     ";
let gameOver = false;
let selectedCell = 0;

// ... código de inicialización del tablero y animaciones ...

// Comprobar que la palabra introducida es válida
function isValidWord(word) {
  return /^[A-ZÑ]{5}$/.test(word) && palabrasValidas.includes(word);
}

// ... resto del código de evaluación y animación permanece sin cambios ...
