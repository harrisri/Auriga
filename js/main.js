// import Phaser from '../node_modules/phaser/src/phaser.js';
// import Turret from './sprites/Turret.js';
// import Enemy from './sprites/Enemy.js';

var config = {
    type: Phaser.AUTO,
    parent: 'content',
    width: 800,
    height: 600,
    physics: {
        default: 'arcade'
    },
    scene: {
        key: 'main',
        preload: preload,
        create: create,
        update: update
    }
};

// Most of the code here was referened from https://gamedevacademy.org/how-to-make-tower-defense-game-with-phaser-3/
// The code from this website and the assets used were modified to fit our purposes

var game = new Phaser.Game(config);

var path;
var ENEMY_SPEED = 1/50000;

var map =      [[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [ -1, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [ 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 0],
                [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0],
                [ 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 0],
                [ 0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [ 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 0, 0],
                [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0],
                [ 0, 0, 0, -1, -1, -1, -1, -1, -1, -1, 0, 0, -1, 0, 0, 0],
                [ 0, 0, 0, -1, 0, 0, 0, 0, 0, -1, 0, 0, -1, 0, 0, 0],
                [ 0, 0, 0, -1, 0, 0, 0, 0, 0, -1, -1, -1, -1, 0, 0, 0],
                [ 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];

function preload() {    
    this.load.atlas('sprites', 'assets/spritesheet.png', 'assets/spritesheet.json');
    this.load.image('tower', 'assets/2DTDassets/PNG/Default size/towerDefense_tile203.png');
    this.load.image('normalEnemy', 'assets/2DTDassets/PNG/Default size/towerDefense_tile245.png');
}

var Enemy = new Phaser.Class({
 
    Extends: Phaser.GameObjects.Sprite,

    initialize:

    function Enemy (scene)
    {
        Phaser.GameObjects.Sprite.call(this, scene, 0, 0, 'normalEnemy', 'enemy');
        this.follower = { t: 0, vec: new Phaser.Math.Vector2() };
    },

    startOnPath: function ()
    {
        // set the t parameter at the start of the path
        this.follower.t = 0;
        
        // get x and y of the given t point            
        path.getPoint(this.follower.t, this.follower.vec);
        
        // set the x and y of our enemy to the received from the previous step
        this.setPosition(this.follower.vec.x, this.follower.vec.y);
        
    },

    update: function (time, delta)
    {
        // move the t point along the path, 0 is the start and 0 is the end
        this.follower.t += ENEMY_SPEED * delta;
            
        // get the new x and y coordinates in vec
        path.getPoint(this.follower.t, this.follower.vec);
        
        // update enemy x and y to the newly obtained x and y
        this.setPosition(this.follower.vec.x, this.follower.vec.y);

        // if we have reached the end of the path, remove the enemy
        if (this.follower.t >= 1)
        {
            this.setActive(false);
            this.setVisible(false);
        }
    }
});

var Turret = new Phaser.Class({
 
    Extends: Phaser.GameObjects.Sprite,

    initialize:

    function Turret (scene)
    {
        Phaser.GameObjects.Sprite.call(this, scene, 0, 0, 'tower', 'turret');
        this.nextTic = 0;
    },
    // we will place the turret according to the grid
    place: function(i, j) {            
        this.y = i * 50 + 50/2;
        this.x = j * 50 + 50/2;
        map[i][j] = 1;            
    },
    update: function (time, delta)
    {
        // time to shoot
        if(time > this.nextTic) {                
            this.nextTic = time + 1000;
        }
    }
});

var Bullet = new Phaser.Class({
 
    Extends: Phaser.GameObjects.Image,
 
    initialize:
 
    function Bullet (scene)
    {
        Phaser.GameObjects.Image.call(this, scene, 0, 0, 'bullet');
 
        this.dx = 0;
        this.dy = 0;
        this.lifespan = 0;
 
        this.speed = Phaser.Math.GetSpeed(600, 1);
    },
 
    fire: function (x, y, angle)
    {
        this.setActive(true);
        this.setVisible(true);
 
        //  Bullets fire from the middle of the screen to the given x/y
        this.setPosition(x, y);
 
    //  we don't need to rotate the bullets as they are round
    //  this.setRotation(angle);
 
        this.dx = Math.cos(angle);
        this.dy = Math.sin(angle);
 
        this.lifespan = 300;
    },
 
    update: function (time, delta)
    {
        this.lifespan -= delta;
 
        this.x += this.dx * (this.speed * delta);
        this.y += this.dy * (this.speed * delta);
 
        if (this.lifespan <= 0)
        {
            this.setActive(false);
            this.setVisible(false);
        }
    }
 
});

function drawGrid(graphics) {
    graphics.lineStyle(1, 0x006400, 0.5);
    for (var i = 0; i < 16; i++) {
        graphics.moveTo((i*100)/2, 0);
        graphics.lineTo((i*100)/2, 600);
    }

    for (var i = 0; i < 12;  i++) {
        graphics.moveTo(0, (i*100)/2);      
        graphics.lineTo(800, (i*100)/2);     
    }
    graphics.strokePath();
}

function placeTurret(pointer) {
    var i = Math.floor(pointer.y/50);
    var j = Math.floor(pointer.x/50);
    if(canPlaceTurret(i, j)) {
        var turret = turrets.get();
        if (turret)
        {
            turret.setActive(true);
            turret.setVisible(true);
            turret.place(i, j);
        }   
    }
}

function canPlaceTurret(i, j) {
    return map[i][j] === 0;
}

// function addBullet(x, y, angle) {
//     var bullet = bullets.get();
//     if (bullet)
//     {
//         bullet.fire(x, y, angle);
//     }
// }

function create() {
    // this graphics element is only for visualization, 
    // its not related to our path
    var graphics = this.add.graphics();
    drawGrid(graphics);
    
    // the path for our enemies
    // parameters are the start x and y of our path
    path = this.add.path(0, 75);
    path.lineTo(75,75);
    path.lineTo(75,125);
    path.lineTo(675,125);
    path.lineTo(675,225);
    path.lineTo(75,225);
    path.lineTo(75,325);
    path.lineTo(625,325);
    path.lineTo(625,525);
    path.lineTo(475,525);
    path.lineTo(475,425);
    path.lineTo(175,425);
    path.lineTo(175,600);
    
    graphics.lineStyle(3, 0xffffff, 1);
    // visualize the path
    path.draw(graphics);

    enemies = this.add.group({ classType: Enemy, runChildUpdate: true });
    this.nextEnemy = 0;

    turrets = this.add.group({ classType: Turret, runChildUpdate: true });
    this.input.on('pointerdown', placeTurret);

    // bullets = this.add.group({ classType: Bullet, runChildUpdate: true });

}

function update(time, delta) {  
    // if its time for the next enemy
    if (time > this.nextEnemy)
    {        
        var enemy = enemies.get();
        if (enemy)
        {
            enemy.setActive(true);
            enemy.setVisible(true);
            
            // place the enemy at the start of the path
            enemy.startOnPath();
            
            this.nextEnemy = time + 1000;
        }       
    }
}