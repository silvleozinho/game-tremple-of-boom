const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1000 },
            debug: false,
        },
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
    },
};

const game = new
    Phaser.Game(config);

let player, platforms, cursors, bullets, enemies, scoreText;
let score = 0;

function preload() {
    
    //carregar imagens
   
    this.load.image('background', 'assets/images/background.png');
    this.load.image('platform', 'assets/platform.png');
    this.load.image('player', 'assets/images/player.png');
    this.load.image('bullet', 'assets/images/bullet.png');
    this.load.image('enemy', 'assets/images/enemy.png');

    //carregar audio

    this.load.audio('backgroundMusic', 'assets/audio/background-music.mp3');
    this.load.audio('shootSound', 'assets/audio/shoot-sound.mp3');
    this.load.audio('explosionSound', 'assets/audio/explosion-sound.mp3');
}

function create() {

    //adicionar fundo

    this.add.image(400, 300, 'background');

    //adicionar plataformas

    platforms = this.physics.add.staticGroup();
    platforms.create(600, 500, 'platform').setScale(2).refreshBody();
    
    platforms = this.physics.add.staticGroup();
    platforms.create(600, 400, 'platform').setScale(2).refreshBody();

    //add player

    player = this.physics.add.sprite(100, 450, 'player').setScale(0.5);
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    //add controles

    cursors = this.input.keyboard.createCursorKeys();

    //add inimigos

    enemies = this.physics.add.group({
        key: 'enemy',
        repeat: 4,
        setXY: { x: 300     , y: 0, stepX: 150 },
    });
    enemies.children.iterate(function (enemy) {
        enemy.setBounce(1);
        enemy.setCollideWorldBounds(true);
        enemy.setVelocity(Phaser.Math.Between(-200, 200), 20);
    });

    //add colisoes

    this.physics.add.collider(player, platforms);
    this.physics.add.collider(enemies, platforms);

    //add grupo de balas

    bullets = this.physics.add.group();

    //add sobreposicao de balas e inimigos

    this.physics.add.overlap(bullets, enemies, hitEnemy, null, this);

    //add music fundo

    const backgroundMusic = this.sound.add('backgroundMusic'); backgroundMusic.play({
        loop: true, volume: 0.02
    });

    //add texto de pontuacao

    scoreText = this.add.text(16, 16, 'Pontuação: 0', {
        fontSize: '32px',
        fill: '#fff',
    });
}

function update() {

    //mov jogador

    if (cursors.left.isDown) {
        player.setVelocityX(-160);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
    } else {
        player.setVelocityX(0);
    }

    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-500);
    }

    //atirar cm SPACE

    if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
        shootBullet(this);
    }
}
function shootBullet(scene) {
    const bullet = bullets.create(player.x, player.y, 'bullet');
    bullet.setVelocityX(400);
    bullet.setGravityY(-1000);

    //tocar som tiro

    scene.sound.play('shootSound',{ volume: 0.03 });
}

function hitEnemy(bullet, enemy) {
    bullet.destroy();
    enemy.destroy();

    //tocar som explosao

    this.sound.play('explosionSound',{ volume: 0.05 });

    //atualizar pont

    score += 10;
    scoreText.setText('Pontuação: ' + score);
}