// 游戏主逻辑
document.addEventListener('DOMContentLoaded', function() {
    // 获取Canvas元素和上下文
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // 游戏状态
    let game = {
        running: false,
        score: 0,
        lives: 3,
        level: 1,
        time: 0,
        gameOver: false
    };

    // 游戏元素
    let player = {
        x: canvas.width / 2 - 15,
        y: canvas.height - 60,
        radius: 20,
        color: '#4dabf7',
        speedX: 0,
        speedY: 0,
        gravity: 0.5,
        jumpPower: 12,
        isJumping: false
    };

    let stars = [];
    let obstacles = [];
    let keys = {};

    // 游戏元素数量
    const STARS_COUNT = 5;
    const OBSTACLES_COUNT = 3;

    // 获取DOM元素
    const scoreElement = document.getElementById('score');
    const livesElement = document.getElementById('lives');
    const levelElement = document.getElementById('level');
    const timeElement = document.getElementById('time');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const instructionsBtn = document.getElementById('instructionsBtn');
    const playAgainBtn = document.getElementById('playAgainBtn');
    const gameOverModal = document.getElementById('gameOverModal');
    const finalScoreElement = document.getElementById('finalScore');
    const finalLevelElement = document.getElementById('finalLevel');
    const gameResultElement = document.getElementById('gameResult');

    // 初始化游戏
    function initGame() {
        game.score = 0;
        game.lives = 3;
        game.level = 1;
        game.time = 0;
        game.gameOver = false;

        player.x = canvas.width / 2 - 15;
        player.y = canvas.height - 60;
        player.speedX = 0;
        player.speedY = 0;

        stars = [];
        obstacles = [];

        // 创建星星
        for (let i = 0; i < STARS_COUNT; i++) {
            stars.push({
                x: Math.random() * (canvas.width - 30) + 15,
                y: Math.random() * (canvas.height - 200) + 50,
                radius: 12,
                color: '#ffd43b',
                collected: false
            });
        }

        // 创建障碍物
        for (let i = 0; i < OBSTACLES_COUNT; i++) {
            obstacles.push({
                x: Math.random() * (canvas.width - 60) + 30,
                y: Math.random() * (canvas.height - 200) + 50,
                width: 40,
                height: 40,
                color: '#ff6b6b',
                speedX: (Math.random() - 0.5) * 4
            });
        }

        updateUI();
    }

    // 更新UI显示
    function updateUI() {
        scoreElement.textContent = game.score;
        livesElement.textContent = game.lives;
        levelElement.textContent = game.level;
        timeElement.textContent = Math.floor(game.time);
    }

    // 绘制游戏元素
    function drawPlayer() {
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        ctx.fillStyle = player.color;
        ctx.fill();
        ctx.closePath();

        // 添加高光效果
        ctx.beginPath();
        ctx.arc(player.x - 8, player.y - 8, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
        ctx.closePath();
    }

    function drawStars() {
        stars.forEach(star => {
            if (!star.collected) {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fillStyle = star.color;
                ctx.fill();
                ctx.closePath();

                // 添加星星光芒效果
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * Math.PI * 2) / 5;
                    const spikeLength = star.radius * 1.5;
                    const spikeX = star.x + Math.cos(angle) * spikeLength;
                    const spikeY = star.y + Math.sin(angle) * spikeLength;

                    if (i === 0) {
                        ctx.moveTo(spikeX, spikeY);
                    } else {
                        ctx.lineTo(spikeX, spikeY);
                    }

                    const innerAngle = angle + Math.PI / 5;
                    const innerX = star.x + Math.cos(innerAngle) * star.radius * 0.5;
                    const innerY = star.y + Math.sin(innerAngle) * star.radius * 0.5;
                    ctx.lineTo(innerX, innerY);
                }
                ctx.closePath();
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.fill();
            }
        });
    }

    function drawObstacles() {
        obstacles.forEach(obstacle => {
            ctx.fillStyle = obstacle.color;
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

            // 添加危险标志
            ctx.fillStyle = '#000';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('!', obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2);
        });
    }

    function drawGround() {
        ctx.fillStyle = '#2a3c5e';
        ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

        // 添加地面纹理
        ctx.fillStyle = '#3a4c6e';
        for (let i = 0; i < canvas.width; i += 30) {
            ctx.fillRect(i, canvas.height - 20, 15, 5);
        }
    }

    // 更新游戏元素
    function updatePlayer() {
        // 水平移动
        if (keys['ArrowLeft']) {
            player.speedX = -6;
        } else if (keys['ArrowRight']) {
            player.speedX = 6;
        } else {
            player.speedX *= 0.9; // 摩擦减速
        }

        // 跳跃
        if (keys['ArrowUp'] && !player.isJumping) {
            player.speedY = -player.jumpPower;
            player.isJumping = true;
        }

        // 超级跳
        if (keys[' '] && !player.isJumping) {
            player.speedY = -player.jumpPower * 1.5;
            player.isJumping = true;
        }

        // 应用重力
        player.speedY += player.gravity;

        // 更新位置
        player.x += player.speedX;
        player.y += player.speedY;

        // 边界检查
        if (player.x - player.radius < 0) {
            player.x = player.radius;
        }
        if (player.x + player.radius > canvas.width) {
            player.x = canvas.width - player.radius;
        }

        // 地面检查
        if (player.y + player.radius > canvas.height - 20) {
            player.y = canvas.height - 20 - player.radius;
            player.speedY = 0;
            player.isJumping = false;
        }

        // 顶部检查
        if (player.y - player.radius < 0) {
            player.y = player.radius;
            player.speedY = 0;
        }
    }

    function updateObstacles() {
        obstacles.forEach(obstacle => {
            // 移动障碍物
            obstacle.x += obstacle.speedX;

            // 边界反弹
            if (obstacle.x <= 0 || obstacle.x + obstacle.width >= canvas.width) {
                obstacle.speedX *= -1;
            }

            // 检测与玩家的碰撞
            if (isColliding(player, obstacle)) {
                if (game.lives > 0) {
                    game.lives--;
                    // 玩家被弹开
                    player.speedY = -8;
                    player.speedX = obstacle.speedX * 2;
                    updateUI();

                    // 改变玩家颜色提示受伤
                    player.color = '#ff6b6b';
                    setTimeout(() => {
                        player.color = '#4dabf7';
                    }, 300);
                }
            }
        });
    }

    function updateStars() {
        stars.forEach(star => {
            if (!star.collected) {
                // 检测与玩家的碰撞
                const dx = player.x - star.x;
                const dy = player.y - star.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < player.radius + star.radius) {
                    star.collected = true;
                    game.score += 10;
                    updateUI();

                    // 检查是否收集完所有星星
                    const allCollected = stars.every(s => s.collected);
                    if (allCollected) {
                        levelUp();
                    }
                }
            }
        });
    }

    // 碰撞检测
    function isColliding(player, obstacle) {
        // 找到圆上距离矩形最近的点
        const closestX = Math.max(obstacle.x, Math.min(player.x, obstacle.x + obstacle.width));
        const closestY = Math.max(obstacle.y, Math.min(player.y, obstacle.y + obstacle.height));

        // 计算距离
        const distanceX = player.x - closestX;
        const distanceY = player.y - closestY;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

        return distance < player.radius;
    }

    // 升级关卡
    function levelUp() {
        game.level++;

        // 重置星星
        stars = [];
        for (let i = 0; i < STARS_COUNT + game.level; i++) {
            stars.push({
                x: Math.random() * (canvas.width - 30) + 15,
                y: Math.random() * (canvas.height - 200) + 50,
                radius: 12,
                color: '#ffd43b',
                collected: false
            });
        }

        // 增加障碍物
        obstacles = [];
        for (let i = 0; i < OBSTACLES_COUNT + game.level; i++) {
            obstacles.push({
                x: Math.random() * (canvas.width - 60) + 30,
                y: Math.random() * (canvas.height - 200) + 50,
                width: 40,
                height: 40,
                color: '#ff6b6b',
                speedX: (Math.random() - 0.5) * (3 + game.level * 0.5)
            });
        }

        // 恢复生命值（每过一关恢复一点）
        if (game.lives < 3) {
            game.lives++;
        }

        updateUI();
    }

    // 游戏结束
    function endGame() {
        game.running = false;
        game.gameOver = true;

        // 显示游戏结果
        finalScoreElement.textContent = game.score;
        finalLevelElement.textContent = game.level;

        if (game.lives <= 0) {
            gameResultElement.textContent = "游戏结束";
        } else {
            gameResultElement.textContent = "游戏胜利!";
        }

        gameOverModal.style.display = 'flex';
    }

    // 绘制游戏
    function draw() {
        // 清除画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 绘制背景
        drawBackground();

        // 绘制地面
        drawGround();

        // 绘制游戏元素
        drawStars();
        drawObstacles();
        drawPlayer();

        // 绘制分数
        drawScore();
    }

    function drawBackground() {
        // 渐变背景
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#0d1b2a');
        gradient.addColorStop(1, '#1b3a4b');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 网格背景
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;

        // 垂直线
        for (let x = 0; x < canvas.width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        // 水平线
        for (let y = 0; y < canvas.height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }

    function drawScore() {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`分数: ${game.score}`, 20, 30);
        ctx.fillText(`生命: ${game.lives}`, 20, 60);
        ctx.fillText(`等级: ${game.level}`, 20, 90);
    }

    // 游戏主循环
    function gameLoop() {
        if (!game.running) return;

        // 更新游戏时间
        game.time += 1/60;

        // 更新游戏元素
        updatePlayer();
        updateObstacles();
        updateStars();

        // 检查游戏结束条件
        if (game.lives <= 0) {
            endGame();
        }

        // 绘制游戏
        draw();

        // 继续游戏循环
        requestAnimationFrame(gameLoop);
    }

    // 键盘控制
    window.addEventListener('keydown', function(e) {
        keys[e.key] = true;
    });

    window.addEventListener('keyup', function(e) {
        keys[e.key] = false;
    });

    // 按钮事件监听
    startBtn.addEventListener('click', function() {
        if (!game.running && !game.gameOver) {
            game.running = true;
            gameLoop();
        }
    });

    pauseBtn.addEventListener('click', function() {
        game.running = !game.running;
        if (game.running) {
            gameLoop();
        }
    });

    resetBtn.addEventListener('click', function() {
        initGame();
        game.running = true;
        gameLoop();
    });

    instructionsBtn.addEventListener('click', function() {
        alert("游戏说明：\n1. 使用方向键控制小球移动\n2. 收集黄色星星获得分数\n3. 避开红色障碍物\n4. 收集所有星星进入下一关\n5. 每关会增加障碍物数量\n6. 生命值降为0时游戏结束");
    });

    playAgainBtn.addEventListener('click', function() {
        gameOverModal.style.display = 'none';
        initGame();
        game.running = true;
        gameLoop();
    });

    // 初始化游戏
    initGame();
    draw();
});