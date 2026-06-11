// ============================================================
// Sandy Pyramid Maze — GBDA 302 Side Quest
// Super Mario Bros theme: fighter explores a sandy pyramid
// and collects bones scattered on the dungeon floor.
// ============================================================

// ------------------------------------------------------------
// SPRITE CONFIGURATION — Fighter Walk Sheet
// fighter_walk.png: 1024 x 128px — 8 frames, 1 row (sideways walk)
// All four directions share the same row since the sheet has
// only one walking animation.
// ------------------------------------------------------------
const SPRITE = {
  frameWidth:  128, // 1024px / 8 frames
  frameHeight: 128, // 128px  / 1 row
  numFrames:   8,
  animSpeed:   8,   // fast, punchy walk cycle
  scale:       0.35,

  rows: {
    down:  0,
    up:    0,
    right: 0,
    left:  0,
  },

  offsets: {
    down:  { x: 0, y: 0 },
    up:    { x: 0, y: 0 },
    right: { x: 0, y: 0 },
    left:  { x: 0, y: 0 },
  },
};

// ------------------------------------------------------------
// BONE CONFIGURATION
// bone_sprite.png: 1400 x 700px — single frame, static image.
// Drawn at a fixed display size rather than as a sprite sheet.
// ------------------------------------------------------------
const BONE_DISPLAY_W = 32;
const BONE_DISPLAY_H = 16;

// ------------------------------------------------------------
// MAZE
// Sandy pyramid dungeon — same structure as the class example.
// Tile values:
//   0 = sandy floor (walkable)
//   1 = stone wall (pyramid block)
//   2 = start position
//   3 = bone location
//   4 = exit (locked until all bones collected)
// ------------------------------------------------------------
const TILE_SIZE = 50;

const MAZE = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 0, 0, 1, 0, 3, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 3, 1, 1],
  [1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 3, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 4, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

// Pyramid-themed tile colours
const TILE_COLORS = {
  0: [210, 185, 140], // sandy floor
  1: [160, 120,  70], // warm sandstone wall
  2: [210, 185, 140], // start — same as floor
  3: [210, 185, 140], // bone tile — same as floor (bone drawn on top)
  4: [160, 120,  70], // exit — colour overridden dynamically
};

// Wall block grout colour for the stone-block effect
const GROUT_COLOR = [130, 95, 50];

// ------------------------------------------------------------
// PLAYER
// ------------------------------------------------------------
let player = {
  x: 0,
  y: 0,
  speed: 2,
  currentFrame: 0,
  frameTimer:   0,
  direction:    "down",
  isMoving:     false,
  hw: 12,
  hh: 12,
};

// ------------------------------------------------------------
// BONES
// ------------------------------------------------------------
let bones = [];
let bonesCollected = 0;

// ------------------------------------------------------------
// GAME STATE
// ------------------------------------------------------------
let gameWon = false;

let characterSheet;
let boneImg;

// ============================================================
// preload()
// ============================================================
function preload() {
  characterSheet = loadImage("assets/images/fighter_walk.png");
  boneImg        = loadImage("assets/images/bone_sprite.png");
}

// ============================================================
// setup()
// ============================================================
function setup() {
  createCanvas(TILE_SIZE * MAZE[0].length, TILE_SIZE * MAZE.length);
  imageMode(CENTER);

  for (let row = 0; row < MAZE.length; row++) {
    for (let col = 0; col < MAZE[row].length; col++) {
      let tile = MAZE[row][col];

      if (tile === 2) {
        player.x = col * TILE_SIZE + TILE_SIZE / 2;
        player.y = row * TILE_SIZE + TILE_SIZE / 2;
      }

      if (tile === 3) {
        bones.push({
          x:         col * TILE_SIZE + TILE_SIZE / 2,
          y:         row * TILE_SIZE + TILE_SIZE / 2,
          collected: false,
        });
      }
    }
  }
}

// ============================================================
// draw()
// ============================================================
function draw() {
  background(190, 160, 110);

  drawMaze();
  drawBones();
  handleInput();
  resolveWallCollisions();
  checkBoneCollection();
  checkExit();
  animateSprite();
  drawCharacter();
  drawHUD();

  if (gameWon) drawWinScreen();
}

// ------------------------------------------------------------
// drawMaze()
// Draws pyramid-stone walls with a simple grout-line effect.
// ------------------------------------------------------------
function drawMaze() {
  rectMode(CORNER);

  for (let row = 0; row < MAZE.length; row++) {
    for (let col = 0; col < MAZE[row].length; col++) {
      let tile = MAZE[row][col];
      let x    = col * TILE_SIZE;
      let y    = row * TILE_SIZE;

      if (tile === 4) {
        if (bonesCollected === bones.length) {
          fill(255, 200, 50); // bright gold — exit is open
        } else {
          fill(100, 75, 40);  // dark — exit locked
        }
        noStroke();
        rect(x, y, TILE_SIZE, TILE_SIZE);

        // Draw a simple doorway symbol
        let cx = x + TILE_SIZE / 2;
        let cy = y + TILE_SIZE / 2;
        if (bonesCollected === bones.length) {
          fill(180, 120, 20);
        } else {
          fill(60, 45, 25);
        }
        noStroke();
        // arch shape
        rect(cx - 8, cy - 10, 16, 20);
        arc(cx, cy - 10, 16, 16, PI, TWO_PI);
      } else if (tile === 1) {
        // Sandstone wall with grout lines
        let c = TILE_COLORS[1];
        fill(c[0], c[1], c[2]);
        noStroke();
        rect(x, y, TILE_SIZE, TILE_SIZE);

        // Grout lines to mimic stacked stone blocks
        stroke(GROUT_COLOR[0], GROUT_COLOR[1], GROUT_COLOR[2]);
        strokeWeight(1);
        // Horizontal grout line in the middle
        line(x, y + TILE_SIZE / 2, x + TILE_SIZE, y + TILE_SIZE / 2);
        // Vertical grout lines — staggered by row
        if (row % 2 === 0) {
          line(x + TILE_SIZE / 2, y, x + TILE_SIZE / 2, y + TILE_SIZE / 2);
        } else {
          line(x + TILE_SIZE / 4, y + TILE_SIZE / 2, x + TILE_SIZE / 4, y + TILE_SIZE);
          line(x + (TILE_SIZE * 3) / 4, y + TILE_SIZE / 2, x + (TILE_SIZE * 3) / 4, y + TILE_SIZE);
        }
        noStroke();
      } else {
        let c = TILE_COLORS[tile];
        fill(c[0], c[1], c[2]);
        noStroke();
        rect(x, y, TILE_SIZE, TILE_SIZE);
      }
    }
  }
}

// ------------------------------------------------------------
// drawBones()
// Draws a scaled bone image at each uncollected bone position.
// ------------------------------------------------------------
function drawBones() {
  for (let i = 0; i < bones.length; i++) {
    if (bones[i].collected) continue;
    image(boneImg, bones[i].x, bones[i].y, BONE_DISPLAY_W, BONE_DISPLAY_H);
  }
}

// ------------------------------------------------------------
// handleInput()
// ------------------------------------------------------------
function handleInput() {
  if (gameWon) return;

  player.isMoving = false;

  if (keyIsDown(87)) {
    player.y -= player.speed;
    player.direction = "up";
    player.isMoving  = true;
  }
  if (keyIsDown(83)) {
    player.y += player.speed;
    player.direction = "down";
    player.isMoving  = true;
  }
  if (keyIsDown(65)) {
    player.x -= player.speed;
    player.direction = "left";
    player.isMoving  = true;
  }
  if (keyIsDown(68)) {
    player.x += player.speed;
    player.direction = "right";
    player.isMoving  = true;
  }
}

// ------------------------------------------------------------
// resolveWallCollisions()
// ------------------------------------------------------------
function resolveWallCollisions() {
  let corners = [
    { x: player.x - player.hw, y: player.y - player.hh },
    { x: player.x + player.hw, y: player.y - player.hh },
    { x: player.x - player.hw, y: player.y + player.hh },
    { x: player.x + player.hw, y: player.y + player.hh },
  ];

  for (let i = 0; i < corners.length; i++) {
    let c   = corners[i];
    let col = floor(c.x / TILE_SIZE);
    let row = floor(c.y / TILE_SIZE);

    if (row < 0 || row >= MAZE.length || col < 0 || col >= MAZE[0].length) continue;

    if (MAZE[row][col] === 1) {
      let tileLeft   = col * TILE_SIZE;
      let tileRight  = tileLeft + TILE_SIZE;
      let tileTop    = row * TILE_SIZE;
      let tileBottom = tileTop + TILE_SIZE;

      let overlapLeft   = (player.x + player.hw) - tileLeft;
      let overlapRight  = tileRight  - (player.x - player.hw);
      let overlapTop    = (player.y + player.hh) - tileTop;
      let overlapBottom = tileBottom - (player.y - player.hh);

      let minOverlap = min(overlapLeft, overlapRight, overlapTop, overlapBottom);

      if      (minOverlap === overlapLeft)   player.x -= overlapLeft;
      else if (minOverlap === overlapRight)  player.x += overlapRight;
      else if (minOverlap === overlapTop)    player.y -= overlapTop;
      else if (minOverlap === overlapBottom) player.y += overlapBottom;
    }
  }
}

// ------------------------------------------------------------
// checkBoneCollection()
// ------------------------------------------------------------
function checkBoneCollection() {
  for (let i = 0; i < bones.length; i++) {
    if (bones[i].collected) continue;
    let d = dist(player.x, player.y, bones[i].x, bones[i].y);
    if (d < TILE_SIZE * 0.6) {
      bones[i].collected = true;
      bonesCollected++;
    }
  }
}

// ------------------------------------------------------------
// checkExit()
// ------------------------------------------------------------
function checkExit() {
  if (bonesCollected < bones.length) return;

  for (let row = 0; row < MAZE.length; row++) {
    for (let col = 0; col < MAZE[row].length; col++) {
      if (MAZE[row][col] === 4) {
        let exitX = col * TILE_SIZE + TILE_SIZE / 2;
        let exitY = row * TILE_SIZE + TILE_SIZE / 2;
        if (dist(player.x, player.y, exitX, exitY) < TILE_SIZE * 0.6) {
          gameWon = true;
        }
      }
    }
  }
}

// ------------------------------------------------------------
// animateSprite()
// ------------------------------------------------------------
function animateSprite() {
  if (player.isMoving) {
    player.frameTimer++;
    if (player.frameTimer >= SPRITE.animSpeed) {
      player.frameTimer   = 0;
      player.currentFrame = (player.currentFrame + 1) % SPRITE.numFrames;
    }
  } else {
    player.currentFrame = 0;
    player.frameTimer   = 0;
  }
}

// ------------------------------------------------------------
// drawCharacter()
// Mirrors the sprite horizontally when moving left so the
// fighter always faces the direction of travel.
// ------------------------------------------------------------
function drawCharacter() {
  let row    = SPRITE.rows[player.direction];
  let offset = SPRITE.offsets[player.direction];

  let sx = player.currentFrame * SPRITE.frameWidth + offset.x;
  let sy = row * SPRITE.frameHeight + offset.y;

  let dw = SPRITE.frameWidth  * SPRITE.scale;
  let dh = SPRITE.frameHeight * SPRITE.scale;

  if (player.direction === "left") {
    // Flip horizontally: scale(-1,1) mirrors around the player's x
    push();
    translate(player.x, player.y);
    scale(-1, 1);
    image(characterSheet, 0, 0, dw, dh, sx, sy, SPRITE.frameWidth, SPRITE.frameHeight);
    pop();
  } else {
    image(characterSheet, player.x, player.y, dw, dh, sx, sy, SPRITE.frameWidth, SPRITE.frameHeight);
  }
}

// ------------------------------------------------------------
// drawHUD()
// Mario-inspired HUD with warm pyramid colouring.
// ------------------------------------------------------------
function drawHUD() {
  // HUD background bar
  rectMode(CORNER);
  noStroke();
  fill(80, 50, 20, 200);
  rect(0, 0, width, 30);

  fill(255, 230, 130);
  textSize(14);
  textAlign(LEFT);
  textFont("monospace");
  text("★ BONES: " + bonesCollected + " / " + bones.length, 10, 20);

  if (bonesCollected === bones.length) {
    fill(255, 220, 50);
    textAlign(RIGHT);
    text("EXIT UNLOCKED! Find the golden door ►", width - 10, 20);
  }
}

// ------------------------------------------------------------
// drawWinScreen()
// Mario-styled win overlay with pyramid flavour.
// ------------------------------------------------------------
function drawWinScreen() {
  // Dark overlay
  fill(0, 0, 0, 170);
  rectMode(CORNER);
  rect(0, 0, width, height);

  // Title card background
  fill(80, 50, 20);
  noStroke();
  rectMode(CENTER);
  rect(width / 2, height / 2, 420, 130, 12);

  stroke(255, 200, 50);
  strokeWeight(3);
  noFill();
  rect(width / 2, height / 2, 420, 130, 12);
  noStroke();

  fill(255, 220, 50);
  textAlign(CENTER);
  textFont("monospace");
  textSize(40);
  text("PYRAMID CLEARED!", width / 2, height / 2 - 14);

  textSize(16);
  fill(210, 185, 140);
  text("All bones collected — you escaped the tomb!", width / 2, height / 2 + 22);
}
