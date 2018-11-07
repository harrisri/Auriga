const SPEED_SCALE = 50000;
const BLOCKING = '#';
const OPEN = '-';
const HIDDEN = '*';
const TILESIZE = 64
const MAPHEIGHT = TILESIZE * 12
const MAPWIDTH = TILESIZE * 16
const COLUMN_N = 16
const ROW_N = 12

var config = {
    type: Phaser.AUTO,
    parent: 'content',
    width: MAPWIDTH,
    height: MAPHEIGHT,
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
var gold = 200;
var goldText;
var life = 20;
var lifeText;
var selectedTurret = "Fire";


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

    // Load Kenney assets tilemap
    this.load.image("tdtiles", "assets/2DTDassets/Tilesheet/towerDefense_tilesheet.png")

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
    this.load.text('level2', 'data/maps/level2');
    this.load.text('level3', 'data/maps/level3');

    // Load background images and UI elements
    this.load.image('background', '/assets/grassBackground.jpg');
    this.load.image('level1', 'assets/tilemaps/level1.png');
    this.load.image('level2', 'assets/tilemaps/level2.png');
    this.load.image('level3', '/assets/tilemaps/level3.png');

    // Load tower sprites
    this.load.image('arrow', 'assets/2DTDassets/PNG/Default size/towerDefense_tile249.png');
    this.load.image('ice', 'assets/2DTDassets/PNG/Default size/towerDefense_tile180.png');
    this.load.image('bomb', 'assets/2DTDassets/PNG/Default size/towerDefense_tile206.png');
    this.load.image('fire', 'assets/2DTDassets/PNG/Default size/towerDefense_tile250.png');

    // Load enemy sprites
    this.load.image('infantry', 'assets/2DTDassets/PNG/Default size/towerDefense_tile245.png');
    this.load.image('heavy', 'assets/2DTDassets/PNG/Default size/towerDefense_tile246.png')
    this.load.image('flying', 'assets/2DTDassets/PNG/Default size/towerDefense_tile271.png')
    this.load.image('speedy', 'assets/2DTDassets/PNG/Default size/towerDefense_tile247.png')

    // Load projectile sprites
    this.load.image('bullet', 'assets/bullet.png');
    this.load.image('fireBullet', 'assets/2DTDassets/PNG/Default size/towerDefense_tile295.png');
    this.load.image('groundFire', 'assets/2DTDassets/PNG/Default size/towerDefense_tile298.png');
    this.load.image('missle', 'assets/2DTDassets/PNG/Default size/towerDefense_tile252.png');


    // Load other sprites
    this.load.image('goldCoin', 'assets/goldCoin.png');
    this.load.image('heart', 'assets/heart.png');

    //load wave data
    this.load.text('waveText', 'data/waves/windingPath');
}

function generateEnemyClass(data){

    var Enemy = new Phaser.Class({

        Extends: Phaser.GameObjects.Image,

        initialize:
        function Enemy (scene)
        {
            // Replace with infantry image when complete
            Phaser.GameObjects.Image.call(this, scene, 0, 0, data.name);
            //Phaser.GameObjects.Image.call(this, scene, 0, 0, 'goblin', 'enemy');
            this.name = data['name']
            this.follower = { t: 0, vec: new Phaser.Math.Vector2() };
            this.speed = data['base_speed'] / SPEED_SCALE;
            this.hp = data['base_hp'];
            this.armor = data['base_armor'];
            this.gold = data['gold_drop'];
            this.moveType = data['move_type'];
            this.slowed = false;

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

            //shrink up the hitbox a bit.
            this.body.setCircle(15);
        },

        receiveDamage: function(damage, slow, duration, fire) {

            //fire damage ignores armor.
            if (fire) {
                this.hp = this.hp - damage;
            }
            else{
                this.hp =  this.hp - (damage - this.armor);
            }

            //tint red when taking damage
            if (!this.slowed) {
                this.setTint(0xffb2b2)
                this.damageTimer = this.time + 100;
            }


            if (!this.slowed && slow > 0) {
                this.originalSpeed = this.speed;
                this.speed = this.speed * slow;
                this.slowed = true;
                this.slowTimer = this.time + duration;
                this.setTint(0x87CEFA);
            }

            // if hp drops below 0 we deactivate this enemy
            if(this.hp <= 0) {
                this.setActive(false);
                this.setVisible(false);
                gold += this.gold;
                goldText.setText(gold);
            }
        },

        update: function (time, delta)
        {
            this.time = time; //used for slow/damage timers

            //damage timer is up and no longer
            if (time > this.damageTimer && !this.slowed) {
                this.setTint(0xffffff);
            }

            //no longer slowed, set to normal color.
            if (this.slowed && time > this.slowTimer) {
                this.speed = this.originalSpeed;
                this.slowed = false;
                this.setTint(0xffffff);
            }

            // move the t point along the path, 0 is the start and 0 is the end
            this.follower.t += this.speed * delta;

            // get the new x and y coordinates in vec
            path.getPoint(this.follower.t, this.follower.vec);

            //rotate to face correct direction
            var angle = Phaser.Math.Angle.Between(this.x, this.y, this.follower.vec.x, this.follower.vec.y);
            this.setRotation(angle)

            // update enemy x and y to the newly obtained x and y
            this.setPosition(this.follower.vec.x, this.follower.vec.y);

            // if we have reached the end of the path, remove the enemy
            if (this.follower.t >= 1)
            {
                this.setActive(false);
                this.setVisible(false);
                life -= 1;
                lifeText.setText(life);
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
            Phaser.GameObjects.Image.call(this, scene, 0, 0, data.name);
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
                this.angle = (angle + Math.PI/2) * Phaser.Math.RAD_TO_DEG;
                addProjectile(this.name, this.x, this.y, angle, this.damage, this.radius, this.duration);
            }
        },

        iceFire: function() {
            var speedy = speedyGroup.getChildren();
            var enemyUnits = speedy.concat(heavyGroup.getChildren(), flyingGroup.getChildren(), infantryGroup.getChildren());

            for(var i = 0; i < enemyUnits.length; i++) {
                if(enemyUnits[i].active && Phaser.Math.Distance.Between(this.x, this.y, enemyUnits[i].x, enemyUnits[i].y) <= this.range){
                    enemyUnits[i].receiveDamage(this.damage, this.slow, this.duration);
                }
            }
        },
        // we will place the turret according to the grid
        place: function(i, j) {
            this.y = i * TILESIZE + TILESIZE/2;
            this.x = j * TILESIZE + TILESIZE/2;
            map[i][j] = 1;

            gold -= this.cost;
            goldText.setText(gold);
        },
        update: function (time, delta)
        {
            // time to shoot
            if(time > this.nextTic) {
                if (this.name == "ice") {
                    this.iceFire();
                }
                else{
                    this.fire()
                }
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

    fire: function (x, y, angle)
    {
        this.setActive(true);
        this.setVisible(true);

        //  Bullets fire from the middle of the screen to the given x/y
        this.setPosition(x, y);

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

    return Projectile;
}

function generateGroundFireClass(data){
    var GroundFire = new Phaser.Class({

    Extends: Phaser.GameObjects.Image,

    initialize:

    function GroundFire (scene)
    {
        Phaser.GameObjects.Image.call(this, scene, 0, 0, 'groundFire');
    },

    update: function (time, delta)
    {
        this.lifespan -= delta;
        if (this.lifespan <= 0)
        {
            this.setActive(false);
            this.setVisible(false);
        }
    }

    });

    return GroundFire;
}


function addProjectile(name, x, y, angle, damage, radius, duration) {
    var projectile = Projectiles.get();
    switch(name){
            //change projectile sprite if needed
            case 'bomb':
                projectile.setTexture('missle')
                projectile.setRotation(angle + Math.PI/2);
                break;
            case 'fire':
                projectile.setTexture('fireBullet');
                projectile.setRotation(angle - Math.PI/2);
                break;
        }
    if (projectile)
    {
        projectile.name = name;
        projectile.damage = damage;
        projectile.radius = radius;
        projectile.duration = duration;
        projectile.fire(x, y, angle);
    }
}

function getEnemy(x, y, distance) {
    //get ALL enemies
    var speedy = speedyGroup.getChildren();
    var enemyUnits = speedy.concat(heavyGroup.getChildren(), flyingGroup.getChildren(), infantryGroup.getChildren());

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

        //check if BOMB AOE
        if(bullet.name == 'bomb'){
            var speedy = speedyGroup.getChildren();
            var enemyUnits = speedy.concat(heavyGroup.getChildren(), flyingGroup.getChildren(), infantryGroup.getChildren());

            for(var i = 0; i < enemyUnits.length; i++) {
                if(enemyUnits[i].active && Phaser.Math.Distance.Between(enemy.x, enemy.y, enemyUnits[i].x, enemyUnits[i].y) <= bullet.radius){
                    enemyUnits[i].receiveDamage(bullet.damage);
                }
            }
        }

        else if (bullet.name == 'fire'){
            //drop ground fire!
            var fire = GroundFireGroup.get();
            fire.x = enemy.x;
            fire.y = enemy.y;
            fire.damage = bullet.damage;
            fire.lifespan = bullet.duration;
            fire.body.setCircle(5);
            fire.setVisible(true);
            fire.setActive(true);
            enemy.receiveDamage(bullet.damage,0,0,true); //fire damage ignores armor
        }

        else{
            enemy.receiveDamage(bullet.damage);
        }
    }
}

function groundFireDamageEnemy(enemy, groundFire){
    if (enemy.active === true && groundFire.active === true) {
        enemy.receiveDamage(groundFire.damage/10, 0, 0, true) //base damage is way overpowered., fire damage ignores armor.
    }
}

function placeTurret(pointer) {
    var i = Math.floor(pointer.y/TILESIZE);
    var j = Math.floor(pointer.x/TILESIZE);
    if(canPlaceTurret(i, j)) {
        var turret;
        switch(selectedTurret){
            case 'Arrow':
                turret = arrowTurrets.get()
                break;
            case 'Bomb':
                turret = bombTurrets.get()
                break;
            case 'Ice':
                turret = iceTurrets.get()
                break;
            case 'Fire':
                turret = fireTurrets.get()
                break;
        }
        if (turret)
        {
            if (gold - turret.cost >= 0)
            {
                turret.setActive(true);
                turret.setVisible(true);
                turret.place(i, j);
            }
            else
            {
                turret.setActive(false);
                turret.setVisible(false);
            }
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
    var start = ['0', '1', '2']
    var end = ['9', '8', '7']

    var grid = [[]]
    var levelMap = {
        startCoords: [null, null, null],
        endCoords: [null, null, null],
        width: null,
        height: null
    }

    var y = 0;
    var x = 0;
    for (var i = 0; i < maptext.length; i++) {
        var char = maptext[i];
        if (char !== '\n'){
            grid[y].push(char);
            var k;
            if (start.includes(char)){
                levelMap.startCoords[start.indexOf(char)] = [x, y]
            }
            else if (end.includes(char)){
                levelMap.endCoords[end.indexOf(char)] = [x, y]
            }
        x++;
        }
        else if (char === '\n'){
            if (maptext[i+1]){
                grid.push([]);
                y++;
                x = 0;
            }
        }
    }

    var tiles = [];
    tiles.length = grid.length;

    for (var i = 0; i < grid.length; i++){
        tiles[i] = [];
        tiles[i].length = grid[i].length;
        for (var j = 0; j < grid[i].length; j++){
            char = grid[i][j]
            if (char === OPEN || start.includes(char) || end.includes(char)) {
                tiles[i][j] = 93; // Build-space tile in Kenney pack [2nd row 2nd column]
            }
            else if (char === HIDDEN){
                tiles[i][j] = 24; // Build-space tile in Kenney pack [2nd row 2nd column]
            }
            else if (char === BLOCKING){
                tiles[i][j] = 24; // Ground-space tile in Kenney pack [5th row 2nd column]
            }
        }
    }

    levelMap.grid = grid;
    levelMap.tiles = tiles;

    return levelMap;
}

function findAdjacent(x, y, x_max, y_max){

    console.log()
    var adj = [
        [x-1, y],   // W
        [x, y-1],   // N
        [x+1, y],   // E
        [x, y+1],   // S
    ]
    var ret = []

    for (var i = 0; i < adj.length; i++){
        if (adj[i][0] < x_max && adj[i][0] >= 0){
            if (adj[i][1] < y_max && adj[i][1] >= 0){
                ret.push(adj[i]);
            }
        }
    }
    return ret;
}


function generatePaths(levelMap){

    var startCoords = null;
    var endCoords = null;

    var paths = [];
    var visited = levelMap.grid.slice();
    console.log(visited);

    for (var k = 0; k < 3; k++){
        var pathList = [];
        if (levelMap.startCoords[k] === null){
            paths[k] = null;
            continue;
        }
        startCoords = levelMap.startCoords[k];
        endCoords = levelMap.endCoords[k];

        console.log("start: " + startCoords);
        console.log("end: " + endCoords);

        pathList.push(startCoords);
        var curr = startCoords;
        var done = false;
        var h = 0;
        var tempx;
        var tempy;
        var temp;
        while (done === false){
            let adj = findAdjacent(curr[0], curr[1], COLUMN_N, ROW_N);

            for (var i = 0; i < adj.length; i++){
                let tempx = adj[i][0];
                let tempy = adj[i][1];
                let temp = levelMap.grid[tempy][tempx];
                if (temp === OPEN && visited[tempy][tempx] !== 'X'){
                    // Mark tiles already visited with an 'X'
                    visited[tempy][tempx] = 'X';
                    curr = [tempx, tempy];
                    pathList.push(curr);
                    continue;
                }
                else if (temp === '9'){
                    curr = [tempx, tempy];
                    pathList.push(curr);
                    done = true;
                    break;
                }
            }
        }
        paths.push(pathList);
    }
    return paths;
}



function parseWaveText(waveData){
    var waves = [[]]

    //split up each wave's data
    var textIntoWaves = waveData.split('\n');
    for (var i = 0; i < textIntoWaves.length; i++) {
        //split each individual wave
        var wave = textIntoWaves[i].split(' ')
        for (var j = 0; j < wave.length; j++) {
            //convert strings to ints
            var converted = parseInt(wave[j],10);
            //if parseInt fails (if parameter isn't numeric), NaN is returned.  Don't replace if converted is NaN
            if (!isNaN(converted)) {
                wave[j] = converted;
            }
        }
        waves.push(wave);
    }
    waves.shift()//first row is empty, remove empty row
    return waves;
}

function allEnemiesDead(){
    var speedy = speedyGroup.getChildren();
    var enemyUnits = speedy.concat(heavyGroup.getChildren(), flyingGroup.getChildren(), infantryGroup.getChildren());

    for (var i = 0; i < enemyUnits.length; i++) {
        if (enemyUnits[i].active) {
            return false;
        }
    }
    return true;
}


function create() {
    // // Parse a map file and produce a 2d array of chars
    // // that can be used to generate the level.
    level1 = this.cache.text.get('level1');
    level2 = this.cache.text.get('level2');
    level3 = this.cache.text.get('level3');
    levelMap1 = parseMap(level1);       // Currently unused.
    levelMap2 = parseMap(level2);
    levelMap3 = parseMap(level3);
    levelPath3 = generatePaths(levelMap3);

    const testmap = this.make.tilemap({ data: levelMap3.tiles, tileWidth: 64, tileHeight: 64 });
    const tileset = testmap.addTilesetImage("tdtiles");
    const layer = testmap.createStaticLayer(0, tileset, 0, 0); // layer index, tileset, x, y

    this.add.image(26, 28, 'goldCoin');
    this.add.image(MAPWIDTH - 56, 28, 'heart');
    goldText = this.add.text(42, 16, '200', {fontSize: '24px', fontStyle: 'Bold'});
    lifeText = this.add.text(MAPWIDTH - 40, 16, '20', {fontSize: '24px', fontStyle: 'Bold'});
    this.waveText = this.add.text(480, 16, "Wave 1", {fontSize:'24px', fontStyle: 'Bold'});
    // this graphics element is only for visualization,
    // its not related to our path
    var graphics = this.add.graphics();

    let waveText = this.cache.text.get('waveText');
    this.waveData = parseWaveText(waveText);

    var startx = levelPath3[0][0][0] * TILESIZE + TILESIZE / 2
    var starty = levelPath3[0][0][1] * TILESIZE + TILESIZE / 2
    path = this.add.path(startx, starty)

    function makePath(pathStart, levelPath){
        for (var i = 0; i < levelPath.length; i++){
            var curr = levelPath[i];
            pathx = curr[0] * TILESIZE + TILESIZE / 2
            pathy = curr[1] * TILESIZE + TILESIZE / 2
            pathStart.lineTo(pathx, pathy)
        }
    }

    makePath(path, levelPath3[0]);

    // Change alpha to 1 to see the path
    graphics.lineStyle(3, 0xffffff, 0);
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

    // Individual groups for each enemy type
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

    arrowTurrets = this.add.group({ classType: Arrow, runChildUpdate: true });
    bombTurrets = this.add.group({ classType: Bomb, runChildUpdate: true });
    fireTurrets = this.add.group({ classType: Fire, runChildUpdate: true });
    iceTurrets = this.add.group({ classType: Ice, runChildUpdate: true });

    //as with projectiles
    const Projectile = generateProjectileClass({"image":"bullet"});
    Projectiles = this.physics.add.group({ classType: Projectile, runChildUpdate: true });

    //add ground fire
    const GroundFire = generateGroundFireClass(fireData);
    GroundFireGroup = this.physics.add.group({classType: GroundFire, runChildUpdate: true});

    //add collisions between enemies and projectiles.
    this.physics.add.overlap(infantryGroup, Projectiles, damageEnemy, null, null);
    this.physics.add.overlap(heavyGroup, Projectiles, damageEnemy);
    this.physics.add.overlap(flyingGroup, Projectiles, damageEnemy);
    this.physics.add.overlap(speedyGroup, Projectiles, damageEnemy);

    //add collisions between enemies and groundFire.
    this.physics.add.overlap(infantryGroup, GroundFireGroup, groundFireDamageEnemy, null, null);
    this.physics.add.overlap(heavyGroup, GroundFireGroup, groundFireDamageEnemy);
    this.physics.add.overlap(flyingGroup, GroundFireGroup, groundFireDamageEnemy);
    this.physics.add.overlap(speedyGroup, GroundFireGroup, groundFireDamageEnemy);


    //clicks place turrets
    this.input.on('pointerdown', placeTurret);

    //variables to assist in spawning enemies in waves
    this.nextEnemy = 0;
    this.nextEnemyIndex = 0;
    this.timeToNextEnemyIndex = 1;
    this.waveIndex = 0;
    this.showCountdown = false;
}

function update(time, delta) {

    if (time > this.nextEnemy)
    {
        this.showCountdown = false;
        this.waveText.setText("Wave " + (this.waveIndex + 1));
        this.waveText.x = MAPWIDTH / 2 - 46;
        var enemyType = this.waveData[this.waveIndex][this.nextEnemyIndex];

        var enemy;
        switch(enemyType){
            case 'i':
                enemy = infantryGroup.get()
                break;
            case 'h':
                enemy = heavyGroup.get()
                break;
            case 'f':
                enemy = flyingGroup.get()
                break;
            case 's':
                enemy = speedyGroup.get()
                break;
        }

        if (enemy)
        {
            enemy.setActive(true);
            enemy.setVisible(true);
            enemy.startOnPath();

            this.nextEnemy = time + this.waveData[this.waveIndex][this.timeToNextEnemyIndex];
            this.nextEnemyIndex = this.nextEnemyIndex + 2;
            this.timeToNextEnemyIndex = this.timeToNextEnemyIndex + 2;
        }
    }

    if (this.showCountdown){
        var timer = Math.round((this.nextEnemy - time)/1000);
        this.waveText.setText("Next Wave in " + timer + "!")
        this.waveText.x = MAPWIDTH / 2 - 100;
    }

    if (this.waveIndex < this.waveData.length - 1) {
        //check if it's time for a new wave: all enemies dead, and there are no more enemies to spawn.
        if (this.timeToNextEnemyIndex > this.waveData[this.waveIndex].length &&
            allEnemiesDead()) {
            //time for a new wave!
            this.nextEnemyIndex = 0;
            this.timeToNextEnemyIndex = 1;
            this.waveIndex++;
            this.nextEnemy = time + 10000; //10 sec until next wave
            this.showCountdown = true;
        }
    }

    else if (allEnemiesDead()){
        console.log("game over!")
    }

}
