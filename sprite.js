// Simple sprite animation using HTML5 Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Sprite properties
const sprite = {
    x: 50,
    y: 120,
    width: 40,
    height: 40,
    dx: 2,
    color: '#4f46e5'
};

function drawSprite() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = sprite.color;
    ctx.fillRect(sprite.x, sprite.y, sprite.width, sprite.height);
}

function updateSprite() {
    sprite.x += sprite.dx;
    if (sprite.x + sprite.width > canvas.width || sprite.x < 0) {
        sprite.dx *= -1;
    }
}

function gameLoop() {
    updateSprite();
    drawSprite();
    requestAnimationFrame(gameLoop);
}

gameLoop();
