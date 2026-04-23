const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30; // 30px per block

const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-block');
const nextCtx = nextCanvas.getContext('2d');
const scoreElement = document.getElementById('score');

// 顏色與形狀定義
const COLORS = [
    null,
    '#00FFFF', // I - Cyan
    '#0000FF', // J - Blue
    '#FFA500', // L - Orange
    '#FFFF00', // O - Yellow
    '#00FF00', // S - Green
    '#800080', // T - Purple
    '#FF0000'  // Z - Red
];

const SHAPES = [
    [],
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], // I
    [[2, 0, 0], [2, 2, 2], [0, 0, 0]], // J
    [[0, 0, 3], [3, 3, 3], [0, 0, 0]], // L
    [[4, 4], [4, 4]], // O
    [[0, 5, 5], [5, 5, 0], [0, 0, 0]], // S
    [[0, 6, 0], [6, 6, 6], [0, 0, 0]], // T
    [[7, 7, 0], [0, 7, 7], [0, 0, 0]]  // Z
];

let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let requestAnimationId = null;
let lastTime = 0;
let dropInterval = 1000;
let dropCounter = 0;
let isGameOver = false;
let isPlaying = false;

// --- Web Audio API 音效 ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
}

function playSound(type) {
    if (!audioCtx) return;
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    
    if (type === 'move') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
    } else if (type === 'rotate') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(600, now + 0.05);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'drop') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'clear') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 1);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 1);
        osc.start(now);
        osc.stop(now + 1);
    }
}

// --- 遊戲邏輯 ---

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function getRandomPiece() {
    const typeId = Math.floor(Math.random() * 7) + 1;
    return {
        matrix: JSON.parse(JSON.stringify(SHAPES[typeId])),
        pos: { x: Math.floor(COLS / 2) - Math.floor(SHAPES[typeId][0].length / 2), y: 0 },
        type: typeId
    };
}

function drawBlock(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    
    // Add shine effect for glassmorphism/premium look
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 2, BLOCK_SIZE - 4, BLOCK_SIZE / 4);
}

function drawMatrix(matrix, offset, context) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                drawBlock(context, x + offset.x, y + offset.y, COLORS[value]);
            }
        });
    });
}

function draw() {
    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0)'; // Transparent to show CSS background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw board
    drawMatrix(board, { x: 0, y: 0 }, ctx);
    
    // Draw current piece
    if (currentPiece) {
        drawMatrix(currentPiece.matrix, currentPiece.pos, ctx);
    }
}

function drawNext() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (nextPiece) {
        // Center the next piece in the 120x120 (4x4 blocks) canvas
        const offsetX = (4 - nextPiece.matrix[0].length) / 2;
        const offsetY = (4 - nextPiece.matrix.length) / 2;
        drawMatrix(nextPiece.matrix, { x: offsetX, y: offsetY }, nextCtx);
    }
}

function merge() {
    currentPiece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + currentPiece.pos.y][x + currentPiece.pos.x] = value;
            }
        });
    });
}

function collide(board, piece) {
    const m = piece.matrix;
    const o = piece.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (board[y + o.y] && board[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function rotate(matrix, dir) {
    // Transpose
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    // Reverse rows
    if (dir > 0) { // Right (Clockwise)
        matrix.forEach(row => row.reverse());
    } else { // Left (Counter-clockwise)
        matrix.reverse();
    }
}

function pieceRotate(dir) {
    const pos = currentPiece.pos.x;
    let offset = 1;
    rotate(currentPiece.matrix, dir);
    
    // Wall kick
    while (collide(board, currentPiece)) {
        currentPiece.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > currentPiece.matrix[0].length) {
            rotate(currentPiece.matrix, -dir); // Revert
            currentPiece.pos.x = pos;
            return;
        }
    }
    playSound('rotate');
}

function pieceMove(offset) {
    currentPiece.pos.x += offset;
    if (collide(board, currentPiece)) {
        currentPiece.pos.x -= offset;
    } else {
        playSound('move');
    }
}

function pieceDrop() {
    currentPiece.pos.y++;
    if (collide(board, currentPiece)) {
        currentPiece.pos.y--;
        merge();
        newPiece();
        clearLines();
        playSound('drop');
    }
    dropCounter = 0;
}

function pieceHardDrop() {
    while (!collide(board, currentPiece)) {
        currentPiece.pos.y++;
    }
    currentPiece.pos.y--;
    merge();
    newPiece();
    clearLines();
    playSound('drop');
    dropCounter = 0;
}

function clearLines() {
    let linesCleared = 0;
    outer: for (let y = board.length - 1; y >= 0; --y) {
        for (let x = 0; x < board[y].length; ++x) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }
        
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        ++y;
        linesCleared++;
    }
    
    if (linesCleared > 0) {
        // Scoring: 1 line = 100, 2 = 300, 3 = 500, 4 = 800
        const points = [0, 100, 300, 500, 800];
        score += points[linesCleared];
        scoreElement.innerText = score;
        playSound('clear');
        
        // Speed up
        dropInterval = Math.max(100, 1000 - (score / 10));
    }
}

function newPiece() {
    currentPiece = nextPiece || getRandomPiece();
    nextPiece = getRandomPiece();
    drawNext();
    
    if (collide(board, currentPiece)) {
        gameOver();
    }
}

function gameOver() {
    isGameOver = true;
    isPlaying = false;
    cancelAnimationFrame(requestAnimationId);
    playSound('gameover');
    document.getElementById('game-over-screen').classList.remove('hidden');
}

function resetGame() {
    board = createMatrix(COLS, ROWS);
    score = 0;
    scoreElement.innerText = score;
    dropInterval = 1000;
    isGameOver = false;
    isPlaying = true;
    nextPiece = null;
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('start-screen').classList.add('hidden');
    
    initAudio();
    newPiece();
    update();
}

function update(time = 0) {
    if (!isPlaying) return;
    
    const deltaTime = time - lastTime;
    lastTime = time;
    
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        pieceDrop();
    }
    
    draw();
    requestAnimationId = requestAnimationFrame(update);
}

// --- 控制 ---
document.addEventListener('keydown', event => {
    if (!isPlaying) return;
    
    switch (event.keyCode) {
        case 37: // Left
            pieceMove(-1);
            break;
        case 39: // Right
            pieceMove(1);
            break;
        case 40: // Down
            pieceDrop();
            break;
        case 38: // Up -> Rotate Right (Clockwise)
            pieceRotate(1);
            break;
        case 90: // Z -> Rotate Left (Counter-clockwise)
            pieceRotate(-1);
            break;
        case 32: // Space -> Hard Drop
            pieceHardDrop();
            break;
    }
});

document.getElementById('start-btn').addEventListener('click', () => {
    initAudio();
    resetGame();
});

document.getElementById('restart-btn').addEventListener('click', () => {
    resetGame();
});

// Initial draw to setup board
board = createMatrix(COLS, ROWS);
draw();
