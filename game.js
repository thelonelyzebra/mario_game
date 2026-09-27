const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const timeEl = document.getElementById("time");
const messageEl = document.getElementById("message");
const restartButton = document.getElementById("restartButton");

const world = {
  width: 2600,
  height: canvas.height,
  groundY: 490,
  gravity: 0.52,
  cameraX: 0,
};

const keys = {
  left: false,
  right: false,
  jump: false,
};

const platforms = [
  { x: 0, y: 490, w: 2600, h: 60, color: "#5a9b2b" },
  { x: 220, y: 420, w: 110, h: 18, color: "#b76d44" },
  { x: 385, y: 370, w: 120, h: 18, color: "#b76d44" },
  { x: 585, y: 315, w: 135, h: 18, color: "#b76d44" },
  { x: 760, y: 365, w: 110, h: 18, color: "#b76d44" },
  { x: 980, y: 430, w: 170, h: 18, color: "#b76d44" },
  { x: 1210, y: 360, w: 150, h: 18, color: "#b76d44" },
  { x: 1430, y: 300, w: 120, h: 18, color: "#b76d44" },
  { x: 1645, y: 260, w: 120, h: 18, color: "#b76d44" },
  { x: 1825, y: 330, w: 160, h: 18, color: "#b76d44" },
  { x: 2100, y: 390, w: 220, h: 18, color: "#b76d44" },
  { x: 2345, y: 350, w: 160, h: 18, color: "#b76d44" },
];

const coinList = [
  { x: 255, y: 380, collected: false },
  { x: 430, y: 330, collected: false },
  { x: 640, y: 270, collected: false },
  { x: 820, y: 320, collected: false },
  { x: 1050, y: 390, collected: false },
  { x: 1270, y: 320, collected: false },
  { x: 1480, y: 260, collected: false },
  { x: 1695, y: 220, collected: false },
  { x: 1890, y: 290, collected: false },
  { x: 2210, y: 350, collected: false },
  { x: 2395, y: 310, collected: false },
];

const enemies = [
  { x: 540, y: 462, w: 28, h: 28, minX: 430, maxX: 620, vx: 1.2 },
  { x: 1120, y: 462, w: 28, h: 28, minX: 980, maxX: 1280, vx: 1.5 },
  { x: 1725, y: 462, w: 28, h: 28, minX: 1600, maxX: 1880, vx: 1.8 },
  { x: 2190, y: 462, w: 28, h: 28, minX: 2100, maxX: 2360, vx: 1.4 },
].map((enemy) => ({ ...enemy, alive: true }));

const player = {
  x: 70,
  y: 400,
  w: 28,
  h: 32,
  vx: 0,
  vy: 0,
  speed: 4,
  jumpForce: 11,
  onGround: false,
  facing: 1,
};

const flag = { x: 2495, y: 260, w: 12, h: 230 };

const game = {
  started: false,
  over: false,
  won: false,
  score: 0,
  lives: 3,
  timeLeft: 120,
  lastTimestamp: 0,
  messageTimer: 0,
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function resetGame() {
  game.started = true;
  game.over = false;
  game.won = false;
  game.score = 0;
  game.lives = 3;
  game.timeLeft = 120;
  game.messageTimer = 0;
  player.x = 70;
  player.y = 400;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  world.cameraX = 0;

  coinList.forEach((coin) => {
    coin.collected = false;
  });

  enemies.forEach((enemy) => {
    enemy.alive = true;
  });

  messageEl.textContent = "Use ← → to run and ↑ / Space to jump.";
  updateHud();
}

function updateHud() {
  scoreEl.textContent = String(game.score);
  livesEl.textContent = String(game.lives);
  timeEl.textContent = String(Math.ceil(game.timeLeft));
}

function loseLife() {
  if (game.over) return;

  game.lives -= 1;
  if (game.lives <= 0) {
    game.lives = 0;
    game.over = true;
    game.started = false;
    messageEl.textContent = "Game over! Press Restart to try again.";
  } else {
    player.x = 60;
    player.y = 390;
    player.vx = 0;
    player.vy = 0;
    messageEl.textContent = "Ouch! Keep going.";
    game.messageTimer = 80;
  }

  updateHud();
}

function collectCoin() {
  for (const coin of coinList) {
    if (!coin.collected) {
      const coinRect = { x: coin.x - 9, y: coin.y - 12, w: 18, h: 24 };
      if (intersects(player, coinRect)) {
        coin.collected = true;
        game.score += 10;
        updateHud();
      }
    }
  }
}

function handleEnemyCollisions() {
  for (const enemy of enemies) {
    if (!enemy.alive) continue;

    const enemyBox = { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h };
    if (!intersects(player, enemyBox)) continue;

    const hitFromAbove = player.vy > 0 && player.y + player.h - enemy.y < 14;
    if (hitFromAbove) {
      enemy.alive = false;
      player.vy = -8;
      game.score += 50;
      updateHud();
    } else {
      loseLife();
      return;
    }
  }
}

function updatePlayer(delta) {
  const moveLeft = keys.left && !game.over;
  const moveRight = keys.right && !game.over;

  if (moveLeft) {
    player.vx = -player.speed;
    player.facing = -1;
  } else if (moveRight) {
    player.vx = player.speed;
    player.facing = 1;
  } else {
    player.vx *= 0.7;
    if (Math.abs(player.vx) < 0.05) player.vx = 0;
  }

  if (keys.jump && player.onGround && !game.over) {
    player.vy = -player.jumpForce;
    player.onGround = false;
    keys.jump = false;
  }

  const previousX = player.x;
  const previousY = player.y;

  player.vy += world.gravity * delta;
  player.x += player.vx * delta;

  for (const platform of platforms) {
    const playerBox = { x: player.x, y: player.y, w: player.w, h: player.h };
    if (!intersects(playerBox, platform)) continue;

    if (player.vx > 0) {
      player.x = platform.x - player.w;
    } else if (player.vx < 0) {
      player.x = platform.x + platform.w;
    }
    player.vx = 0;
  }

  player.y += player.vy * delta;
  player.onGround = false;

  for (const platform of platforms) {
    const playerBox = { x: player.x, y: player.y, w: player.w, h: player.h };
    if (!intersects(playerBox, platform)) continue;

    if (player.vy > 0 && previousY + player.h <= platform.y + 10) {
      player.y = platform.y - player.h;
      player.vy = 0;
      player.onGround = true;
    } else if (player.vy < 0 && previousY >= platform.y + platform.h - 10) {
      player.y = platform.y + platform.h;
      player.vy = 0;
    }
  }

  player.x = clamp(player.x, 0, world.width - player.w);

  if (player.y > canvas.height + 50) {
    loseLife();
    return;
  }

  if (player.x + player.w >= flag.x && !game.won) {
    game.won = true;
    game.over = true;
    game.started = false;
    game.score += 1000;
    messageEl.textContent = "You win! Press Restart to play again.";
    updateHud();
  }

  if (player.x >= world.width - 90) {
    player.x = world.width - 90;
  }

  world.cameraX = clamp(player.x - canvas.width * 0.35, 0, world.width - canvas.width);
}

function updateEnemies(delta) {
  for (const enemy of enemies) {
    if (!enemy.alive) continue;

    enemy.x += enemy.vx * delta;
    if (enemy.x <= enemy.minX || enemy.x + enemy.w >= enemy.maxX) {
      enemy.vx *= -1;
      enemy.x = clamp(enemy.x, enemy.minX, enemy.maxX - enemy.w);
    }
  }
}

function updateGame(delta) {
  if (!game.started || game.over) return;

  game.timeLeft = Math.max(0, game.timeLeft - (delta / 60));
  if (game.timeLeft <= 0) {
    game.over = true;
    game.started = false;
    messageEl.textContent = "Time up! Press Restart to play again.";
  }

  updatePlayer(delta);
  updateEnemies(delta);
  collectCoin();
  handleEnemyCollisions();

  if (game.messageTimer > 0) {
    game.messageTimer -= 1;
    if (game.messageTimer === 0) {
      messageEl.textContent = "Use ← → to run and ↑ / Space to jump.";
    }
  }

  if (!game.over) {
    updateHud();
  }
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#7fd2ff");
  sky.addColorStop(0.65, "#dfffef");
  sky.addColorStop(0.66, "#9ad76d");
  sky.addColorStop(1, "#6aa556");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffdd6b";
  ctx.beginPath();
  ctx.arc(820, 90, 38, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 6; i += 1) {
    const x = (i * 180 - world.cameraX * 0.25) % (canvas.width + 140) - 80;
    const y = 70 + (i % 3) * 30;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 25, y - 8, 26, 0, Math.PI * 2);
    ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlatform(platform) {
  const x = platform.x - world.cameraX;
  ctx.fillStyle = platform.color;
  ctx.fillRect(x, platform.y, platform.w, platform.h);

  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(x, platform.y, platform.w, 6);
}

function drawCoins() {
  for (const coin of coinList) {
    if (coin.collected) continue;
    const x = coin.x - world.cameraX;
    const bob = Math.sin((coin.x + performance.now() * 0.005) * 0.1) * 4;

    ctx.fillStyle = "#ffd64a";
    ctx.beginPath();
    ctx.arc(x, coin.y + bob, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#d4a300";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 2, coin.y + bob - 7);
    ctx.lineTo(x + 2, coin.y + bob - 7);
    ctx.stroke();
  }
}

function drawEnemies() {
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const x = enemy.x - world.cameraX;
    const y = enemy.y;

    ctx.fillStyle = "#8b5631";
    ctx.fillRect(x, y, enemy.w, enemy.h);
    ctx.fillStyle = "#d6a86b";
    ctx.fillRect(x + 2, y + 8, enemy.w - 4, 8);
    ctx.fillStyle = "#000";
    ctx.fillRect(x + 5, y + 8, 5, 5);
    ctx.fillRect(x + enemy.w - 10, y + 8, 5, 5);
  }
}

function drawPlayer() {
  const x = player.x - world.cameraX;
  const y = player.y;
  const runCycle = Math.sin(performance.now() / 90) * 2;
  const legOffset = player.onGround ? runCycle : 0;

  ctx.fillStyle = "#c62828";
  ctx.fillRect(x + 7, y, 14, 8);

  ctx.fillStyle = "#f7d0a7";
  ctx.fillRect(x + 9, y + 8, 10, 9);

  ctx.fillStyle = "#1d4ea2";
  ctx.fillRect(x + 6, y + 17, 16, 12);

  ctx.fillStyle = "#f7d0a7";
  ctx.fillRect(x + 10, y + 16, 8, 6);

  ctx.fillStyle = "#1d4ea2";
  ctx.fillRect(x + 5, y + 28, 7, 10 + legOffset);
  ctx.fillRect(x + 16, y + 28, 7, 10 - legOffset);

  ctx.fillStyle = "#000";
  ctx.fillRect(x + 8, y + 12, 3, 3);
  ctx.fillRect(x + 17, y + 12, 3, 3);
}

function drawFlag() {
  const x = flag.x - world.cameraX;
  ctx.fillStyle = "#f4f4f4";
  ctx.fillRect(x, flag.y, 4, flag.h);
  ctx.fillStyle = "#e53935";
  ctx.beginPath();
  ctx.moveTo(x + 4, flag.y + 12);
  ctx.lineTo(x + 58, flag.y + 25);
  ctx.lineTo(x + 4, flag.y + 40);
  ctx.closePath();
  ctx.fill();
}

function drawGame() {
  drawBackground();

  for (const platform of platforms) {
    drawPlatform(platform);
  }

  drawCoins();
  drawFlag();
  drawEnemies();
  drawPlayer();

  if (!game.started && !game.over && !game.won) {
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 34px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Press any arrow key to start", canvas.width / 2, canvas.height / 2);
  }

  if (game.over) {
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 42px Arial";
    ctx.textAlign = "center";
    ctx.fillText(game.won ? "You Won!" : "Game Over", canvas.width / 2, canvas.height / 2 - 10);
  }
}

function gameLoop(timestamp) {
  if (!game.lastTimestamp) {
    game.lastTimestamp = timestamp;
  }

  const delta = Math.min((timestamp - game.lastTimestamp) / 16.6667, 2.1);
  game.lastTimestamp = timestamp;

  updateGame(delta);
  drawGame();

  requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowleft", "a"].includes(key)) {
    keys.left = true;
  }
  if (["arrowright", "d"].includes(key)) {
    keys.right = true;
  }
  if (["arrowup", "w", " "].includes(key) || event.code === "Space") {
    keys.jump = true;
    if (!game.started && !game.over) {
      game.started = true;
      messageEl.textContent = "Use ← → to run and ↑ / Space to jump.";
    }
  }
  if (event.key === "Enter" && !game.started) {
    resetGame();
  }
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowleft", "a"].includes(key)) {
    keys.left = false;
  }
  if (["arrowright", "d"].includes(key)) {
    keys.right = false;
  }
  if (["arrowup", "w", " "].includes(key) || event.code === "Space") {
    keys.jump = false;
  }
});

restartButton.addEventListener("click", resetGame);

updateHud();
requestAnimationFrame(gameLoop);
