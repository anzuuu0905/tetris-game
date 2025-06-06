const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const linesElement = document.getElementById('lines');
const startButton = document.getElementById('startButton');

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

const TETROMINOS = {
    I: {
        shape: [[1, 1, 1, 1]],
        color: '#00f0f0'
    },
    O: {
        shape: [[1, 1], [1, 1]],
        color: '#f0f000'
    },
    T: {
        shape: [[0, 1, 0], [1, 1, 1]],
        color: '#a000f0'
    },
    S: {
        shape: [[0, 1, 1], [1, 1, 0]],
        color: '#00f000'
    },
    Z: {
        shape: [[1, 1, 0], [0, 1, 1]],
        color: '#f00000'
    },
    J: {
        shape: [[1, 0, 0], [1, 1, 1]],
        color: '#0000f0'
    },
    L: {
        shape: [[0, 0, 1], [1, 1, 1]],
        color: '#f0a000'
    }
};

class Piece {
    constructor(tetromino) {
        this.tetromino = tetromino;
        this.shape = tetromino.shape;
        this.color = tetromino.color;
        this.x = Math.floor((COLS - this.shape[0].length) / 2);
        this.y = 0;
    }

    draw() {
        this.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    ctx.fillStyle = this.color;
                    ctx.fillRect(
                        (this.x + x) * BLOCK_SIZE,
                        (this.y + y) * BLOCK_SIZE,
                        BLOCK_SIZE - 1,
                        BLOCK_SIZE - 1
                    );
                }
            });
        });
    }

    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    rotate() {
        const rotated = this.shape[0].map((_, index) =>
            this.shape.map(row => row[index]).reverse()
        );
        this.shape = rotated;
    }

    getNextPosition(dx, dy) {
        return { x: this.x + dx, y: this.y + dy };
    }
}

class Game {
    constructor() {
        this.board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.currentPiece = null;
        this.gameOver = false;
        this.isPaused = false;
        this.dropTime = 1000;
        this.lastDrop = 0;
    }

    init() {
        this.board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.isPaused = false;
        this.dropTime = 1000;
        this.lastDrop = 0;
        this.spawnPiece();
        this.updateScore();
    }

    spawnPiece() {
        const pieces = Object.keys(TETROMINOS);
        const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
        this.currentPiece = new Piece(TETROMINOS[randomPiece]);
        
        if (this.collision(0, 0)) {
            this.gameOver = true;
        }
    }

    collision(dx, dy, shape = null) {
        const piece = this.currentPiece;
        const testShape = shape || piece.shape;
        
        for (let y = 0; y < testShape.length; y++) {
            for (let x = 0; x < testShape[y].length; x++) {
                if (testShape[y][x]) {
                    const newX = piece.x + x + dx;
                    const newY = piece.y + y + dy;
                    
                    if (newX < 0 || newX >= COLS || newY >= ROWS) {
                        return true;
                    }
                    
                    if (newY >= 0 && this.board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    merge() {
        const piece = this.currentPiece;
        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const boardY = piece.y + y;
                    const boardX = piece.x + x;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = piece.color;
                    }
                }
            });
        });
    }

    clearLines() {
        let linesCleared = 0;
        
        for (let y = ROWS - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(COLS).fill(0));
                linesCleared++;
                y++;
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropTime = Math.max(100, 1000 - (this.level - 1) * 100);
            this.updateScore();
        }
    }

    drop() {
        if (!this.collision(0, 1)) {
            this.currentPiece.move(0, 1);
        } else {
            this.merge();
            this.clearLines();
            this.spawnPiece();
        }
    }

    moveLeft() {
        if (!this.collision(-1, 0)) {
            this.currentPiece.move(-1, 0);
        }
    }

    moveRight() {
        if (!this.collision(1, 0)) {
            this.currentPiece.move(1, 0);
        }
    }

    rotate() {
        const piece = this.currentPiece;
        const originalShape = piece.shape;
        piece.rotate();
        
        if (this.collision(0, 0)) {
            piece.shape = originalShape;
        }
    }

    hardDrop() {
        while (!this.collision(0, 1)) {
            this.currentPiece.move(0, 1);
            this.score += 2;
        }
        this.drop();
        this.updateScore();
    }

    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        this.board.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    ctx.fillStyle = cell;
                    ctx.fillRect(
                        x * BLOCK_SIZE,
                        y * BLOCK_SIZE,
                        BLOCK_SIZE - 1,
                        BLOCK_SIZE - 1
                    );
                }
            });
        });
        
        if (this.currentPiece) {
            this.currentPiece.draw();
        }
    }

    updateScore() {
        scoreElement.textContent = this.score;
        levelElement.textContent = this.level;
        linesElement.textContent = this.lines;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
    }
}

const game = new Game();
let animationId;

function gameLoop(timestamp) {
    if (!game.gameOver && !game.isPaused) {
        if (timestamp - game.lastDrop > game.dropTime) {
            game.drop();
            game.lastDrop = timestamp;
        }
        
        game.draw();
    }
    
    if (game.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        ctx.font = '20px Arial';
        ctx.fillText('Press Start to play again', canvas.width / 2, canvas.height / 2 + 40);
        startButton.textContent = 'ゲーム開始';
        return;
    }
    
    animationId = requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    if (game.gameOver || (!game.currentPiece && !game.isPaused)) return;
    
    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            game.moveLeft();
            break;
        case 'ArrowRight':
            e.preventDefault();
            game.moveRight();
            break;
        case 'ArrowDown':
            e.preventDefault();
            game.drop();
            break;
        case 'ArrowUp':
            e.preventDefault();
            game.rotate();
            break;
        case ' ':
            e.preventDefault();
            game.togglePause();
            break;
    }
});

startButton.addEventListener('click', () => {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    game.init();
    game.lastDrop = performance.now();
    gameLoop(performance.now());
    startButton.textContent = 'リスタート';
});