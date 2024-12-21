let player, platforms, cursors, bullets, enemies, scoreText, bulletsText;
let score = 0;
let isJumping = false;  // Variável para controlar o estado do pulo
let playerHealth = 100;  // Vida inicial do jogador
let healthBar;  // Barra de vida
let collisionCount = 0;  // Contador de colisões com inimigos
let isGameOver = false;  // Flag para verificar se o jogo acabou
let isInvulnerable = false;  // Flag de invulnerabilidade
let invulnerabilityTimer;  // Temporizador de invulnerabilidade
let gameOverText, finalScoreText;  // Texto de Game Over
let isGameWon = false;  // Flag para verificar se o jogo foi vencido
let winText;  // Texto de vitória
let door;  // Porta para o próximo nível
let currentLevel = 1;  // Variável para rastrear o nível atual
let levelText;  // Texto de nível
let bulletLimit;  // Limite de balas
let bulletsRemaining;  // Balas restantes

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1000 },  // Gravidade para puxar o personagem para baixo
            debug: false,
        },
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
    },
};

const game = new Phaser.Game(config);

function preload() {
    // Carregar imagens
    this.load.image('background', 'assets/images/background.png');
    this.load.image('platform', 'assets/images/platform.png');
    this.load.image('player', 'assets/images/player.png');
    this.load.image('bullet', 'assets/images/bullet.png');
    this.load.image('enemy', 'assets/images/enemy.png');
    this.load.image('door', 'assets/images/door.png');  // Adicionar imagem da porta

    // Carregar áudio
    this.load.audio('backgroundMusic', 'assets/audio/background-music.mp3');
    this.load.audio('shootSound', 'assets/audio/shoot-sound.mp3');
    this.load.audio('explosionSound', 'assets/audio/explosion-sound.mp3');
}

function create() {
    // Adicionar fundo
    this.add.image(400, 300, 'background');

    // Adicionar plataformas
    platforms = this.physics.add.staticGroup();
    platforms.create(100, 550, 'platform').setScale(0.5).refreshBody();
    platforms.create(250, 450, 'platform').setScale(0.5).refreshBody();
    platforms.create(400, 350, 'platform').setScale(0.5).refreshBody();
    platforms.create(550, 250, 'platform').setScale(0.5).refreshBody();
    platforms.create(700, 150, 'platform').setScale(0.5).refreshBody();

    // Adicionar o jogador
    player = this.physics.add.sprite(50, 500, 'player').setScale(0.5);
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    // Adicionar controles
    cursors = this.input.keyboard.createCursorKeys();

    // Adicionar inimigos
    enemies = this.physics.add.group({
        key: 'enemy',
        repeat: 4,
        setXY: { x: 150, y: 0, stepX: 300 },
    });

    enemies.children.iterate(function (enemy) {
        enemy.setBounce(1);
        enemy.setCollideWorldBounds(true);
        enemy.setVelocity(Phaser.Math.Between(-200, 200), 20);
    });

    // Adicionar colisões
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(enemies, platforms);

    // Adicionar grupo de balas
    bullets = this.physics.add.group();
    this.physics.add.overlap(bullets, enemies, hitEnemy, null, this);

    // Adicionar colisão entre o jogador e os inimigos
    this.physics.add.overlap(player, enemies, playerHitEnemy, null, this);

    // Barra de Vida do Jogador
    healthBar = this.add.graphics();
    updateHealthBar();  // Inicializa a barra de vida

    // Música de fundo
    const backgroundMusic = this.sound.add('backgroundMusic');
    backgroundMusic.play({ loop: true, volume: 0.02 });

    // Texto de pontuação
    scoreText = this.add.text(16, 16, 'Pontuação: 0', {
        fontSize: '32px',
        fill: '#fff',
    });

    // Texto de balas
    bulletsText = this.add.text(600, 16, 'Balas: 10', {
        fontSize: '32px',
        fill: '#fff',
    });

    // Definir limite de balas para o nível 1
    bulletLimit = 10;
    bulletsRemaining = bulletLimit;

    // Tecla "R" para reiniciar o jogo
    this.input.keyboard.on('keydown-R', () => {
        if (isGameOver) {
            restartGame.call(this);  // Reinicia o jogo se estiver no Game Over
        }
    });

    // Adicionar a porta para o próximo nível
    door = this.physics.add.sprite(750, 100, 'door').setScale(0.5);
    door.body.allowGravity = false;  // Certifique-se de que a porta não é afetada pela gravidade
    door.setImmovable(true);
    this.physics.add.overlap(player, door, reachFinish, null, this);
}

function update() {
    // Se o jogo acabou ou está exibindo a mensagem de vitória, não permite ações do jogador
    if (isGameOver || isGameWon) return;

    // Movimentação do jogador
    if (cursors.left.isDown) {
        player.setVelocityX(-160);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
    } else {
        player.setVelocityX(0);
    }

    // Controle de pulo
    if (cursors.up.isDown && !isJumping && player.body.onFloor()) {
        player.setVelocityY(-500);
        isJumping = true;
    }

    if (player.body.onFloor()) {
        isJumping = false;
    }

    // Atirar com a tecla SPACE, se houver balas restantes
    if (Phaser.Input.Keyboard.JustDown(cursors.space) && bulletsRemaining > 0) {
        shootBullet(this);
        bulletsRemaining--;
        bulletsText.setText('Balas: ' + bulletsRemaining);

        // Verifica se as balas acabaram
        if (bulletsRemaining === 0) {
            gameOver.call(this);  // Chama a função de Game Over
        }
    }
}

// Função para atirar as balas
function shootBullet(scene) {
    const bullet = bullets.create(player.x, player.y, 'bullet');
    bullet.setVelocityX(400);
    bullet.setGravityY(-1000);
    scene.sound.play('shootSound', { volume: 0.03 });
}

// Função chamada quando a bala acerta um inimigo
function hitEnemy(bullet, enemy) {
    bullet.destroy();
    enemy.destroy();
    this.sound.play('explosionSound', { volume: 0.05 });
    score += 10;
    scoreText.setText('Pontuação: ' + score);

    // Verifica se todos os inimigos foram eliminados
    if (enemies.countActive(true) === 0) {
        winGame.call(this);  // Chama a função de vitória
    }
}

// Função chamada quando o jogador colide com um inimigo
function playerHitEnemy(player, enemy) {
    // Verifica a colisão com precisão
    const playerBounds = player.getBounds();
    const enemyBounds = enemy.getBounds();

    if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, enemyBounds)) {
        // Se o jogador estiver invulnerável, não sofre dano
        if (isInvulnerable) return;

        // Dano ao jogador: subtrai 20 da vida
        playerHealth -= 20;
        collisionCount++;

        // Atualiza a barra de vida e altera a cor dela conforme o número de colisões
        updateHealthBar();

        // Altera a cor da barra após 2 e 4 colisões
        if (collisionCount === 2) {
            healthBar.fillStyle(0xffff00);  // Amarelo após 2 colisões
        } else if (collisionCount === 4) {
            healthBar.fillStyle(0xff0000);  // Vermelho após 4 colisões
        }

        // Se a vida do jogador chegar a 0 ou se o jogador tomar 5 hits, chama o Game Over
        if (collisionCount >= 5 || playerHealth <= 0) {
            gameOver.call(this);  // Chama a função de Game Over
        } else {
            // Ativar invulnerabilidade
            isInvulnerable = true;

            // Desativar a invulnerabilidade após 1 segundo
            invulnerabilityTimer = this.time.delayedCall(1000, () => {
                isInvulnerable = false;  // Desativa a invulnerabilidade
            });
        }
    }
}

// Atualiza a barra de vida
function updateHealthBar() {
    healthBar.clear();
    healthBar.fillStyle(0x00ff00);  // Cor inicial da barra (verde)
    healthBar.fillRect(10, 10, playerHealth * 2, 20);  // Largura = vida * 2

    // Se a vida for menor ou igual a 50, muda para amarela
    if (playerHealth <= 50 && collisionCount < 2) {
        healthBar.fillStyle(0xffff00);  // Cor amarela
    }

    // Se a vida for menor ou igual a 20, muda para vermelha
    if (playerHealth <= 20 && collisionCount < 4) {
        healthBar.fillStyle(0xff0000);  // Cor vermelha
    }
}

// Função de Game Over
function gameOver() {
    isGameOver = true;  // Define o estado do jogo como "Game Over"

    // Exibe o texto de Game Over
    if (!gameOverText) { // Certifique-se de não recriar o texto se ele já existir
        gameOverText = this.add.text(400, 300, 'GAME OVER', {
            fontSize: '64px',
            fill: '#ff0000',
            fontStyle: 'bold',
        }).setOrigin(0.5);
    }

    // Exibe a pontuação final
    if (!finalScoreText) { // Certifique-se de não recriar o texto se ele já existir
        finalScoreText = this.add.text(400, 400, 'Pontuação Final: ' + score, {
            fontSize: '32px',
            fill: '#fff',
        }).setOrigin(0.5);
    }
}

// Função de Vitória
function winGame() {
    isGameWon = true;  // Define o estado do jogo como "Vencido"

    // Exibe o texto de Vitória temporário
    winText = this.add.text(400, 300, 'Faça o parkour até a saída', {
        fontSize: '32px',
        fill: '#00ff00',
        fontStyle: 'bold',
    }).setOrigin(0.5);

    // Remove o texto de Vitória após 5 segundos
    this.time.delayedCall(5000, () => {
        winText.destroy();
        isGameWon = false;  // Permite que o jogo continue após a mensagem desaparecer
    });
}

// Função chamada quando o jogador alcança a porta para o próximo nível
function reachFinish() {
    startLevel2.call(this);  // Inicia o nível 2
}

// Função para iniciar o nível 2
function startLevel2() {
    currentLevel = 2;  // Atualiza o nível atual
    // Limpar elementos do nível 1
    platforms.clear(true, true);
    enemies.clear(true, true);
    if (door) door.destroy();

    // Adicionar fundo
    this.add.image(400, 300, 'background');

    // Adicionar plataformas do nível 2
    platforms.create(100, 550, 'platform').setScale(0.5).refreshBody();
    platforms.create(300, 450, 'platform').setScale(0.5).refreshBody();
    platforms.create(500, 350, 'platform').setScale(0.5).refreshBody();
    platforms.create(700, 250, 'platform').setScale(0.5).refreshBody();
    platforms.create(900, 150, 'platform').setScale(0.5).refreshBody();

    // Reposicionar o jogador
    if (!player) {
        player = this.physics.add.sprite(50, 500, 'player').setScale(0.5);
        player.setBounce(0.2);
        player.setCollideWorldBounds(true);
    } else {
        player.setPosition(50, 500);
        player.setVelocity(0, 0);
    }

    // Adicionar controles
    cursors = this.input.keyboard.createCursorKeys();

    // Adicionar inimigos do nível 2 (mais rápidos)
    enemies = this.physics.add.group({
        key: 'enemy',
        repeat: 6,
        setXY: { x: 150, y: 0, stepX: 150 },
    });

    enemies.children.iterate(function (enemy) {
        enemy.setBounce(1);
        enemy.setCollideWorldBounds(true);
        enemy.setVelocity(Phaser.Math.Between(-300, 300), 20);  // Inimigos mais rápidos
    });

    // Adicionar colisões
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(enemies, platforms);

    // Adicionar grupo de balas
    this.physics.add.overlap(bullets, enemies, hitEnemy, null, this);

    // Adicionar colisão entre o jogador e os inimigos
    this.physics.add.overlap(player, enemies, playerHitEnemy, null, this);

    // Adicionar a área de chegada do nível 2
    const finishLine = this.add.rectangle(950, 50, 40, 40, 0x00ff00);
    this.physics.add.existing(finishLine, true);
    this.physics.add.overlap(player, finishLine, () => {
        this.add.text(400, 300, 'Você completou o nível 2!', {
            fontSize: '32px',
            fill: '#00ff00',
            fontStyle: 'bold',
        }).setOrigin(0.5);
    }, null, this);

    // Exibe mensagem de nível 2
    levelText = this.add.text(400, 300, 'Nível 2', {
        fontSize: '64px',
        fill: '#ff0000',
        fontStyle: 'bold',
    }).setOrigin(0.5);

    // Remove o texto de Nível 2 após 5 segundos
    this.time.delayedCall(5000, () => {
        levelText.destroy();
    });

    // Atualizar limite de balas para o nível 2
    bulletLimit = 15;
    bulletsRemaining = bulletLimit;
    bulletsText.setText('Balas: ' + bulletsRemaining);

    // Adicionar a barra de vida no nível 2
    healthBar = this.add.graphics();
    updateHealthBar();
}

// Função para reiniciar o jogo
function restartGame() {
    if (currentLevel === 2) {
        currentLevel = 1;  // Reinicia o jogo para o nível 1
        create.call(this);  // Recria o nível 1
    } else {
        create.call(this);  // Recria o nível 1 se estiver no nível 1
    }

    isGameOver = false;
    isGameWon = false;  // Redefine o estado de vitória
    collisionCount = 0;
    playerHealth = 100;
    score = 0;
    scoreText.setText('Pontuação: 0');
    bulletLimit = 10;  // Redefine o limite de balas para o nível 1
    bulletsRemaining = bulletLimit;
    bulletsText.setText('Balas: ' + bulletsRemaining);
    updateHealthBar();  // Atualiza a barra de vida para o estado inicial

    // Remove o texto de Game Over, se ele existir
    if (gameOverText) {
        gameOverText.destroy();
        gameOverText = null; // Certifique-se de que gameOverText seja nulo após destruir
    }
    if (finalScoreText) {
        finalScoreText.destroy();
        finalScoreText = null; // Certifique-se de que finalScoreText seja nulo após destruir
    }
}