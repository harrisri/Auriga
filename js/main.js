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
var SPEED_SCALE = 50000;

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
    // Load unit and tower files
    this.load.json('infantry', 'data/units/infantry.json')
    this.load.json('heavy', 'data/units/heavy.json')
    this.load.json('flying', 'data/units/flying.json')
    this.load.json('speedy', 'data/units/speedy.json')
    this.load.json('arrow', 'data/towers/arrow.json')
    this.load.json('fire', 'data/towers/fire.json')
    this.load.json('ice', 'data/towers/ice.json')
    this.load.json('bomb', 'data/towers/bomb.json')

    // Load map files
    this.load.text('level1', 'data/maps/level1');
    this.load.text('level2', 'data/maps/level1');
    this.load.text('level3', 'data/maps/level1');

    // Load background images and UI elements
    this.load.image('background', '/assets/grassBackground.jpg');

    // Load unit and tower sprites
    this.load.atlas('sprites', 'assets/spritesheet.png', 'assets/spritesheet.json');
    this.load.image('bullet', 'assets/bullet.png');
    this.load.image('goblin', 'assets/goblin.png');
}

function generateEnemyClass(data){

    var Enemy = new Phaser.Class({

        Extends: Phaser.GameObjects.Image,

        initialize:
        function Enemy (scene)
        {
            // Replace with infantry image when complete
            Phaser.GameObjects.Image.call(this, scene, 0, 0, 'goblin');
            //Phaser.GameObjects.Image.call(this, scene, 0, 0, 'goblin', 'enemy');
            this.name = data['name']
            this.follower = { t: 0, vec: new Phaser.Math.Vector2() };
            this.speed = data['base_speed'] / SPEED_SCALE;
            this.hp = data['base_hp'];
            this.armor = data['base_armor'];
            this.gold = data['gold_drop'];
            this.moveType = data['move_type'];
        },

        startOnPath: function ()
        {
            // set the t parameter at the start of the path
            this.follower.t = 0;

            // get x and y of the given t point
            path.getPoint(this.follower.t, this.follower.vec);

            // set the x and y of our enemy to the received from the previous step
            this.setPosition(this.follower.vec.x, this.follower.vec.y);

            this.hp = data['base_hp'];

        },

        receiveDamage: function(damage) {
            this.hp =  this.hp - (damage - this.armor);           
            
            // if hp drops below 0 we deactivate this enemy
            if(this.hp <= 0) {
                this.setActive(false);
                this.setVisible(false);      
            }
        },

        update: function (time, delta)
        {
            // move the t point along the path, 0 is the start and 0 is the end
            this.follower.t += this.speed * delta;

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

    return Enemy;
}


function generateTowerClass(data){

    var Tower = new Phaser.Class({

        Extends: Phaser.GameObjects.Image,

        initialize:
        function Tower (scene)
        {
            let data = game.cache.json.get('arrow');
            Phaser.GameObjects.Image.call(this, scene, 0, 0, 'sprites', 'turret');
            this.nextTic = 0;

            this.name = data['name'];
            this.target = data['target'];
            this.level = 1;
            levelKey = 'level_' + this.level;
            this.cost = data['cost'][levelKey];
            this.damage = data['damage'][levelKey];
            this.range = data['range'][levelKey];
            this.rate = data['rate'][levelKey];
            this.radius = data['radius'][levelKey];
            this.slow = data['slow'][levelKey];
            this.duration = data['duration'][levelKey];
            this.ability = data['final_ability'];
            this.abilityActive = false;
        },

        // Update tower values when upgraded
        upgrade: function() {
            if (this.level <= 3) {
                this.level += 1;
            }
            levelKey = 'level_' + this.level;
            this.cost = data['cost'][levelKey];
            this.damage = data['damage'][levelKey];
            this.range = data['range'][levelKey];
            this.rate = data['rate'][levelKey];
            this.radius = data['radius'][levelKey];
            this.slow = data['slow'][levelKey];
            this.duration = data['duration'][levelKey];
            if (levelKey === 4){
                this.abilityActive = true;
            }
        },

        fire: function() {
            var enemy = getEnemy(this.x, this.y, this.range);
            if(enemy) {
                var angle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);
                addProjectile(this.x, this.y, angle, this.damage);
                this.angle = (angle + Math.PI/2) * Phaser.Math.RAD_TO_DEG;
            }
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
                this.fire()
                this.nextTic = time + this.rate;
            }
        }
    });

    return Tower;
}

function generateProjectileClass(data){
    var Projectile = new Phaser.Class({
 
    Extends: Phaser.GameObjects.Image,
 
    initialize:
 
    function Projectile (scene)
    {
        Phaser.GameObjects.Image.call(this, scene, 0, 0, data.image);
 
        this.dx = 0;
        this.dy = 0;
        this.lifespan = 0;
        this.damage = 0;
 
        this.speed = Phaser.Math.GetSpeed(600, 1);
    },
 
    fire: function (x, y, angle, damage)
    {
        this.setActive(true);
        this.setVisible(true);
 
        //  Bullets fire from the middle of the screen to the given x/y
        this.setPosition(x, y);
 
        this.setRotation(angle);
 
        this.dx = Math.cos(angle);
        this.dy = Math.sin(angle);
 
        this.lifespan = 300;
        this.damage = damage;
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

    return Projectile;
}

function addProjectile(x, y, angle, damage) {
    var projectile = Projectiles.get();
    if (projectile)
    {
        projectile.fire(x, y, angle, damage);
    }
}

function getEnemy(x, y, distance) {
    var enemyUnits = enemies.getChildren();
    for(var i = 0; i < enemyUnits.length; i++) {       
        if(enemyUnits[i].active && Phaser.Math.Distance.Between(x, y, enemyUnits[i].x, enemyUnits[i].y) <= distance)
            return enemyUnits[i];
    }
    return false;
}

function damageEnemy(enemy, bullet) {  
    // only if both enemy and bullet are alive
    if (enemy.active === true && bullet.active === true) {
        // we remove the bullet right away
        bullet.setActive(false);
        bullet.setVisible(false);    
        
        // decrease the enemy hp with BULLET_DAMAGE
        enemy.receiveDamage(bullet.damage);
    }
}

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

function parseMap(maptext){
    // Expects a string read in from a map text file.
    // Returns an array of char 'tiles' needed to build the map

    // Map syntax:
    //   # :  Blocking (Buildable)
    //   - :  Open (Path)
    //   0, 1, 2 : Start points. Add more below if needed
    //   9, 8, 7 : End points. Add more below if needed
    var blocking = '#';
    var open = '-';
    var start = ['0', '1', '2']
    var end = ['9', '8', '7']

    var map = [[]]

    var row = 0;
    for (var i = 0; i < maptext.length; i++) {
        var char = maptext[i];
        if (char !== '\n'){
            map[row].push(char);
        }
        else if (char === '\n'){
            map.push([]);
            row++
        }
    }

    return map;
}

function create() {
    this.add.image(400, 300, 'background');
    // this graphics element is only for visualization,
    // its not related to our path
    var graphics = this.add.graphics();
    drawGrid(graphics);

    // Parse a map file and produce a 2d array of chars
    // that can be used to generate the level.
    level1 = this.cache.text.get('level1');
    level2 = this.cache.text.get('level2');
    level3 = this.cache.text.get('level3');
    levelMap1 = parseMap(level1);       // Currently unused.
    levelMap2 = parseMap(level2);
    levelMap3 = parseMap(level3);
  
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

    // Get enemy data and generate classes to instantiate enemies
    let infantryData = game.cache.json.get('infantry');
    let heavyData = game.cache.json.get('heavy');
    let flyingData = game.cache.json.get('flying');
    let speedyData = game.cache.json.get('speedy');

    const Infantry = generateEnemyClass(infantryData);
    const Heavy = generateEnemyClass(heavyData);
    const Flying = generateEnemyClass(flyingData);
    const Speedy = generateEnemyClass(speedyData);

    enemies = this.physics.add.group({ classType: Infantry, runChildUpdate: true });
    this.nextEnemy = 0;

    // Individual groups for each enemy type ?
    infantryGroup = this.physics.add.group({ classType: Infantry, runChildUpdate: true });
    heavyGroup = this.physics.add.group({ classType: Heavy, runChildUpdate: true });
    flyingGroup = this.physics.add.group({ classType: Flying, runChildUpdate: true });
    speedyGroup = this.physics.add.group({ classType: Speedy, runChildUpdate: true });

    // Do the same thing with towers
    let arrowData = game.cache.json.get('arrow');
    let bombData = game.cache.json.get('bomb');
    let fireData = game.cache.json.get('fire');
    let iceData = game.cache.json.get('ice');

    const Arrow = generateTowerClass(arrowData);
    const Bomb = generateTowerClass(bombData);
    const Fire = generateTowerClass(fireData);
    const Ice = generateTowerClass(iceData);

    turrets = this.add.group({ classType: Arrow, runChildUpdate: true });

    //as with projectiles
    const Projectile = generateProjectileClass({"image":"bullet"});
    Projectiles = this.physics.add.group({ classType: Projectile, runChildUpdate: true });

    this.physics.add.overlap(enemies, Projectiles, damageEnemy);

    this.input.on('pointerdown', placeTurret);
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

            this.nextEnemy = time + 10000;
        }
    }
}
