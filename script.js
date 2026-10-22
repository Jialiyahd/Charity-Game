
/* =========================================
   CHARITY: WATER - WATER QUEST
   Interactive Waste Sorting Game
========================================= */


/* =========================================
   1. GAME SETTINGS
========================================= */

// Points needed to win
const GOAL_SCORE = 100;

// Game lasts 60 seconds
const TOTAL_GAME_TIME = 60;

// Points for correct and incorrect answers
const CORRECT_POINTS = 10;
const WRONG_POINTS = 5;


/* =========================================
   2. GAME VARIABLES
========================================= */

let score = 0;
let timeLeft = TOTAL_GAME_TIME;
let gameActive = false;
let selectedItem = null;
let timerInterval = null;
let soundEnabled = true;
let audioContext = null;

// Used to keep track of each game
let gameRound = 0;

// Waste items used in the game
const wasteItems = [
  { name: "Plastic Bottle", icon: "🧴", bin: "recycle" },
  { name: "Newspaper", icon: "📰", bin: "recycle" },
  { name: "Cardboard Box", icon: "📦", bin: "recycle" },
  { name: "Soda Can", icon: "🥫", bin: "recycle" },
  { name: "Paper Bag", icon: "🛍️", bin: "recycle" },
  { name: "Food Wrapper", icon: "🍬", bin: "trash" },
  { name: "Used Tissue", icon: "🧻", bin: "trash" },
  { name: "Dirty Sponge", icon: "🧽", bin: "trash" },
  { name: "Broken Ceramic Cup", icon: "☕", bin: "trash" },
  { name: "Plastic Straw", icon: "🥤", bin: "trash" }
];

// Game messages
const WINNING_MESSAGES = [
  "Amazing job! You reached 100 points and completed Water Quest!",
  "Congratulations! You're a clean water champion!",
  "Great work! You sorted the waste and helped clean the water!"
];

const LOSING_MESSAGES = [
  "Good effort! Every drop counts. Try again!",
  "Almost there! Keep practicing your sorting skills!",
  "Time is up! Give Water Quest another try!"
];


/* =========================================
   3. FIND HTML ELEMENTS
========================================= */

const grid = document.getElementById("grid");
const scoreDisplay = document.getElementById("current-cans");
const timerDisplay = document.getElementById("timer");
const timerBar = document.getElementById("timer-bar");
const highScoreDisplay = document.getElementById("high-score");

const startButton = document.getElementById("start-game");
const resetButton = document.getElementById("reset-game");
const trashButton = document.getElementById("trash-bin");
const recycleButton = document.getElementById("recycle-bin");

const feedbackDisplay = document.getElementById("game-feedback");

const achievementModal = document.getElementById("achievements");
const achievementCard = achievementModal.querySelector(".achievement-card");
const achievementIcon = document.getElementById("achievement-icon");
const achievementTitle = document.getElementById("achievement-title");
const achievementMessage = document.getElementById("achievement-message");
const finalScoreDisplay = document.getElementById("final-score");
const restartButton = document.getElementById("modal-restart");

const confettiContainer = document.getElementById("confetti-container");

const soundButton = document.getElementById("sound-toggle");
const soundIcon = document.getElementById("sound-icon");
const soundText = soundButton.querySelector(".btn-text");


/* =========================================
   4. HIGH SCORE
========================================= */

// Get the saved high score
function getHighScore() {
  try {
    return Number(localStorage.getItem("waterQuestHighScore")) || 0;
  } catch (error) {
    return 0;
  }
}

// Save a new high score
function saveHighScore() {
  try {
    const highScore = getHighScore();

    if (score > highScore) {
      localStorage.setItem("waterQuestHighScore", score);
    }
  } catch (error) {
    // Game still works if storage is unavailable
  }

  updateHighScore();
}

// Update the high score on screen
function updateHighScore() {
  highScoreDisplay.textContent = getHighScore();
}


/* =========================================
   5. SOUND EFFECTS
========================================= */

// Create audio when the player interacts
function initializeAudio() {
  if (!soundEnabled) return;

  try {
    if (!audioContext) {
      const AudioClass =
        window.AudioContext || window.webkitAudioContext;

      if (AudioClass) {
        audioContext = new AudioClass();
      }
    }

    if (audioContext && audioContext.state === "suspended") {
      audioContext.resume();
    }
  } catch (error) {
    // Ignore audio errors
  }
}

// Play a simple sound
function playSound(frequency, duration = 0.15) {
  if (!soundEnabled) return;

  try {
    initializeAudio();

    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const volume = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    volume.gain.setValueAtTime(0.12, audioContext.currentTime);
    volume.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + duration
    );

    oscillator.connect(volume);
    volume.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    // Game continues without sound
  }
}


/* =========================================
   6. UPDATE SCORE
========================================= */

function updateScore() {
  scoreDisplay.textContent = score;
}

// Show feedback after sorting
function showFeedback(message, correct) {
  feedbackDisplay.textContent = message;

  feedbackDisplay.classList.remove("correct", "incorrect");

  if (correct === true) {
    feedbackDisplay.classList.add("correct");
  } else if (correct === false) {
    feedbackDisplay.classList.add("incorrect");
  }
}


/* =========================================
   7. CREATE GAME GRID
========================================= */

// Randomly shuffle the items
function shuffleItems(items) {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));

    const temporaryItem = shuffled[i];
    shuffled[i] = shuffled[randomIndex];
    shuffled[randomIndex] = temporaryItem;
  }

  return shuffled;
}

// Add clickable items to the grid
function createGrid() {
  grid.innerHTML = "";
  selectedItem = null;

  const items = shuffleItems(wasteItems).slice(0, 9);

  items.forEach((item) => {
    const cell = document.createElement("button");

    cell.type = "button";
    cell.className = "grid-cell waste-item";

    cell.dataset.bin = item.bin;

    cell.innerHTML = `
      <span class="waste-icon">${item.icon}</span>
      <span class="waste-name">${item.name}</span>
    `;

    cell.disabled = !gameActive;

    cell.addEventListener("click", () => {
      selectItem(cell, item);
    });

    grid.appendChild(cell);
  });
}


/* =========================================
   8. SELECT AN ITEM
========================================= */

function selectItem(cell, item) {
  if (!gameActive || cell.disabled) return;

  // Remove previous selection
  document.querySelectorAll(".grid-cell").forEach((element) => {
    element.classList.remove("selected");
    element.setAttribute("aria-pressed", "false");
  });

  // Save the selected item
  selectedItem = {
    element: cell,
    bin: item.bin,
    name: item.name
  };

  // Highlight the selected item
  cell.classList.add("selected");
  cell.setAttribute("aria-pressed", "true");

  showFeedback(
    `${item.name} selected! Choose Trash or Recycle.`,
    null
  );
}


/* =========================================
   9. SORT ITEMS INTO BINS
========================================= */

function sortItem(chosenBin) {
  if (!gameActive) return;

  // Player must select an item first
  if (!selectedItem) {
    showFeedback("Select an item in the water first!", false);
    return;
  }

  const itemElement = selectedItem.element;

  // Check whether the chosen bin is correct
  if (chosenBin === selectedItem.bin) {

    // Correct answer earns 10 points
    score += CORRECT_POINTS;

    showFeedback("Correct! +10 points 🎉", true);
    playSound(700);

    itemElement.classList.add("sorted-correct");

  } else {

    // Incorrect answer loses 5 points
    score = Math.max(0, score - WRONG_POINTS);

    showFeedback("Incorrect! -5 points. Try the next item!", false);
    playSound(250);

    itemElement.classList.add("sorted-incorrect");
  }

  // Update score immediately
  updateScore();
  saveHighScore();

  // Remove the sorted item from play
  itemElement.classList.remove("selected");
  itemElement.setAttribute("aria-pressed", "false");
  itemElement.disabled = true;

  selectedItem = null;

  // Check whether the player won
  if (score >= GOAL_SCORE) {
    endGame(true);
    return;
  }

  // If all items are sorted, create new items
  const remainingItems = [...grid.children].filter(
    (cell) => !cell.disabled
  );

  if (remainingItems.length === 0) {
    createGrid();
  }
}


/* =========================================
   10. TIMER
========================================= */

// Update countdown and progress bar
function updateTimer() {
  timerDisplay.textContent = timeLeft;

  const percentage = (timeLeft / TOTAL_GAME_TIME) * 100;

  timerBar.style.width = `${percentage}%`;

  // Change timer color when time is running out
  if (timeLeft <= 10) {
    timerBar.classList.add("warning");
  } else {
    timerBar.classList.remove("warning");
  }
}


/* =========================================
   11. START GAME
========================================= */

function startGame() {
  if (gameActive) return;

  // Stop any previous timer
  clearInterval(timerInterval);

  // Reset game variables
  gameRound++;
  score = 0;
  timeLeft = TOTAL_GAME_TIME;
  gameActive = true;
  selectedItem = null;

  // Reset displays
  updateScore();
  updateTimer();

  // Hide popup and clear confetti
  achievementModal.style.display = "none";
  confettiContainer.innerHTML = "";

  // Disable Start button during the game
  startButton.disabled = true;
  startButton.textContent = "Game in Progress...";
  startButton.classList.add("running");

  // Enable sorting bins
  trashButton.disabled = false;
  recycleButton.disabled = false;

  // Create game items
  createGrid();

  showFeedback("Select an item and choose the correct bin!", null);

  initializeAudio();

  // Start countdown
  timerInterval = setInterval(() => {
    timeLeft--;

    updateTimer();

    if (timeLeft <= 0) {
      endGame(false);
    }
  }, 1000);
}


/* =========================================
   12. RESET GAME
========================================= */

function resetGame() {
  // Stop the countdown
  clearInterval(timerInterval);

  gameRound++;
  gameActive = false;
  selectedItem = null;

  score = 0;
  timeLeft = TOTAL_GAME_TIME;

  // Reset screen
  updateScore();
  updateTimer();

  // Clear game items and confetti
  grid.innerHTML = "";
  confettiContainer.innerHTML = "";

  // Hide achievement popup
  achievementModal.style.display = "none";

  // Restore Start button
  startButton.disabled = false;
  startButton.textContent = "Start Game";
  startButton.classList.remove("running");

  // Disable bins until game starts
  trashButton.disabled = true;
  recycleButton.disabled = true;

  showFeedback("Game reset! Click Start Game to play.", null);
}


/* =========================================
   13. END GAME
========================================= */

function endGame(playerWon) {
  if (!gameActive) return;

  // Stop the game
  clearInterval(timerInterval);
  gameActive = false;
  selectedItem = null;

  saveHighScore();

  // Disable the sorting buttons
  trashButton.disabled = true;
  recycleButton.disabled = true;

  // Disable remaining game items
  document.querySelectorAll(".grid-cell").forEach((cell) => {
    cell.disabled = true;
  });

  // Restore Start button
  startButton.disabled = false;
  startButton.textContent = "Start Game";
  startButton.classList.remove("running");

  // Pick a random result message
  const messages = playerWon ? WINNING_MESSAGES : LOSING_MESSAGES;

  const randomIndex = Math.floor(Math.random() * messages.length);
  const message = messages[randomIndex];

  // Show the result popup
  showAchievement(playerWon, message);

  if (playerWon) {
    playSound(900, 0.4);
    celebrateWin();
  } else {
    playSound(300, 0.3);
  }
}


/* =========================================
   14. ACHIEVEMENT POPUP
========================================= */

function showAchievement(playerWon, message) {
  achievementCard.classList.remove("win", "try-again");

  if (playerWon) {
    achievementCard.classList.add("win");

    achievementIcon.textContent = "🎉";
    achievementTitle.textContent = "Quest Complete!";
  } else {
    achievementCard.classList.add("try-again");

    achievementIcon.textContent = "💧";
    achievementTitle.textContent = "Nice Try!";
  }

  achievementMessage.textContent = message;
  finalScoreDisplay.textContent = score;

  achievementModal.style.display = "flex";
  restartButton.focus();
}


/* =========================================
   15. CONFETTI CELEBRATION
========================================= */

function celebrateWin() {
  confettiContainer.innerHTML = "";

  const colors = [
    "#FFC907",
    "#2E9DF7",
    "#4FCB53",
    "#FF902A",
    "#F16061"
  ];

  // Create 80 pieces of confetti
  for (let i = 0; i < 80; i++) {
    const confetti = document.createElement("span");

    confetti.className = "confetti-piece";

    // Random colors and positions
    confetti.style.backgroundColor =
      colors[Math.floor(Math.random() * colors.length)];

    confetti.style.left = `${Math.random() * 100}%`;

    confetti.style.animationDelay =
      `${Math.random() * 1.5}s`;

    confetti.style.animationDuration =
      `${2 + Math.random() * 2}s`;

    confettiContainer.appendChild(confetti);
  }

  // Remove confetti after celebration
  const celebrationRound = gameRound;

  setTimeout(() => {
    if (celebrationRound === gameRound) {
      confettiContainer.innerHTML = "";
    }
  }, 5500);
}


/* =========================================
   16. BUTTON EVENT LISTENERS
========================================= */

// Start button
startButton.addEventListener("click", startGame);

// Reset button
resetButton.addEventListener("click", resetGame);

// Trash button
trashButton.addEventListener("click", () => {
  sortItem("trash");
});

// Recycling button
recycleButton.addEventListener("click", () => {
  sortItem("recycle");
});

// Play Again button
restartButton.addEventListener("click", () => {
  resetGame();
  startGame();
});

// Sound button
soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;

  if (soundEnabled) {
    soundIcon.textContent = "🔊";
    soundText.textContent = "Sound ON";
    initializeAudio();
  } else {
    soundIcon.textContent = "🔇";
    soundText.textContent = "Sound OFF";
  }
});


/* =========================================
   17. INITIAL GAME SETUP
========================================= */

// Display initial score and timer
updateScore();
updateTimer();
updateHighScore();

// Create the starting grid
createGrid();

// Keep sorting bins disabled until game starts
trashButton.disabled = true;
recycleButton.disabled = true;

