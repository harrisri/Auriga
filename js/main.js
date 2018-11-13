const SPEED_SCALE = 50000;
const BLOCKING = '#';
const OPEN = '-';
const HIDDEN = '*';
const TILESIZE = 64;
const MAPHEIGHT = TILESIZE * 12;
const MAPWIDTH = TILESIZE * 16;
const COLUMN_N = 16;
const ROW_N = 12;
const SELL_PERCENTAGE = 0.8;

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
var gold = 2000;
var goldText;
var life = 20;
var lifeText;
var explosion;

var selectedTurret = "";
// Controls whether to display a turret sprite on mouse pointer
var placing = false;
var upgradeSellFlag = false;

var map =      [[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [ -1, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [ 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0],
                [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1, 0],
                [ 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0],
                [ 0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [ 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 0],
                [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0],
                [ 0, 0, 0, -1, -1, -1, -1, -1, -1, -1, 0, 0, -1, 0, 0],
                [ 0, 0, 0, -1, 0, 0, 0, 0, 0, -1, 0, 0, -1, 0, 0],
                [ 0, 0, 0, -1, 0, 0, 0, 0, 0, -1, -1, -1, -1, 0, 0],
                [ 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];

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
    this.load.image('upgradeButton', 'assets/UpgradeButton.png')
    this.load.image('sellButton', 'assets/SellButton.png')

    //load wave data
    this.load.text('waveText', 'data/waves/windingPath');

    //load ice tower explosion;
    this.load.setPath('assets/')
    this.load.multiatlas('iceExplosion','Ice_Explosion.json');
}

function generateEnemyClass(data){

    var Enemy = new Phaser.Class({

        Extends: Phaser.GameObjects.Image,

        initialize:
        function Enemy (scene)
        {
            Phaser.GameObjects.Image.call(this, scene, 0, 0, data.name);
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
        getUpgradeCost: function(){
            if (this.level <= 3) {
                levelKey = 'level_' + (this.level + 1);
                return data['cost'][levelKey];
            }
            else{
                return 'NA'
            }
        },
        fire: function() {
            var enemy = getEnemy(this.x, this.y, this.range, this.target);
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
                    if (enemyUnits[i].moveType === this.target) {
                        iceExplosion(this.x, this.y);
                        enemyUnits[i].receiveDamage(this.damage, this.slow, this.duration);
                    }
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

function iceExplosion(x,y){
    var explosion = iceExplosions.get().setActive(true);
    explosion.x = x;
    explosion.y = y;
    explosion.play('explode');
}

function addProjectile(name, x, y, angle, damage, radius, duration) {
    var projectile = Projectiles.get();
    switch(name){
        //change projectile sprite if needed
        case 'arrow':
            projectile.setTexture('bullet');
            break;
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

function getEnemy(x, y, distance, turret_target) {
    //get ALL enemies
    var speedy = speedyGroup.getChildren();
    var enemyUnits = speedy.concat(heavyGroup.getChildren(), flyingGroup.getChildren(), infantryGroup.getChildren());

    for(var i = 0; i < enemyUnits.length; i++) {
        if(enemyUnits[i].active && Phaser.Math.Distance.Between(x, y, enemyUnits[i].x, enemyUnits[i].y) <= distance){
            if (turret_target == 'air-ground') {
                return enemyUnits[i];
            }
            else if (turret_target == enemyUnits[i].moveType){
                return enemyUnits[i];
            }
        }
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
            fire.body.setCircle(1);
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
    if (placing == true)
    {
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
                    //put turret on map
                    turret.setActive(true);
                    turret.setVisible(true);
                    turret.place(i, j);

                    //make tower interactive
                    makeTowerButtonsInteractive('tower',turret);
                    placing = false;
                }
                else
                {
                    turret.setActive(false);
                    turret.setVisible(false);
                    placing = false;
                }
            }
        }
    }
}

function canPlaceTurret(i, j) {
    return map[i][j] === 0;
}

function showUpgradeAndSell(tower){
    var down = tower.y + 45;
    var left = tower.x - 40;
    var right = tower.x + 40;

    //create sell button container
    this.sellButton.setActive(true).setVisible(true);
    this.sellText.setText("Sell\n$"+(Math.round(tower.cost*SELL_PERCENTAGE))).setOrigin(0.5, 0.5);
    this.sellContainer.add([this.sellButton,this.sellText]);
    this.sellContainer.setPosition(right,down);

    //create upgrade button container
    this.upgradeButton.setActive(true).setVisible(true);
    this.upgradeText.setText("Upgrade\n$"+tower.getUpgradeCost()).setOrigin(0.5, 0.5);
    this.upgradeContainer.add([this.upgradeButton,this.upgradeText]);
    this.upgradeContainer.setPosition(left,down);

    //so troops run underneath the buttons.
    this.upgradeContainer.depth = 100;
    this.sellContainer.depth = 100;

    //make these buttons interactive.  First need to create a hitbox.
    var upgradeHitbox = upgradeContainer.getBounds();
    var sellHitbox = sellContainer.getBounds();
    this.upgradeContainer.setSize(upgradeHitbox.width, upgradeHitbox.height);
    this.sellContainer.setSize(sellHitbox.width, sellHitbox.height);

    makeTowerButtonsInteractive('upgrade',this.upgradeContainer,tower);
    makeTowerButtonsInteractive('sell',this.sellContainer,tower);

    //flag for hiding buttons when player clicks away.
    upgradeSellFlag = true;
}

function makeTowerButtonsInteractive(type, button, tower){
    button.setInteractive();
    switch(type)
    {
        case 'tower':
            button.on('pointerout', () => enterButtonRestState(button));
            button.on('pointerover', () => enterButtonHoverState(button));
            button.on('pointerdown', () => showUpgradeAndSell(button));
            break;
        case 'upgrade':
            button.on('pointerdown', () => upgradeTower(button, tower));
            break;
        case 'sell':
            button.on('pointerdown', () => sellTower(button, tower));
            break;
    }
}

function upgradeTower(button, tower){
    alert("upgrading!"); 
}

function sellTower(button, tower){
    //add percentage of tower cost to gold.
    gold += (tower.cost * SELL_PERCENTAGE);
    goldText.setText(gold);

    //clear out space for placing new towers.
    var i = Math.floor(tower.y/TILESIZE);
    var j = Math.floor(tower.x/TILESIZE);
    map[i][j] = 0;

    //deactivate this tower.
    tower.setActive(false).setVisible(false);
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
// Find adjacent coordinates to [x, y] within the bounds 0 < x < x_max and 0 < y < y_max
// Returns a 1D array of coordinate pairs
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
// Traverses levelMap.grid, which is represented by map characters ('#', '-', Start/End Numbers)
// Generates up to 3 PathList arrays containing in-order coordinate pairs for each enemy path
// returns [ [<path1-coordinates>], [<path2-coordinates], [<path3-coordinates>] ]

    var startCoords = null;
    var endCoords = null;

    var paths = []; // Top-level array to be returned
    var visited = levelMap.grid.slice(); // Shallow copy to keep track of visited tiles

    for (var k = 0; k < 3; k++){
        var pathList = [];
        if (levelMap.startCoords[k] === null){
            // If no start tile for this path, skip it.
            paths[k] = null;
            continue;
        }
        startCoords = levelMap.startCoords[k];
        endCoords = levelMap.endCoords[k];

        pathList.push(startCoords);
        var curr = startCoords;
        var done = false;
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
                }
                // TODO: de-magic this.
                else if (temp === '9' || temp === '8' || temp === 7){
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

function addButtonInput(towerButton) {
    towerButton.setInteractive();
    towerButton.on('pointerover', () => enterButtonHoverState(towerButton));
    towerButton.on('pointerout', () => enterButtonRestState(towerButton));
    towerButton.on('pointerdown', () => selectTowerForPlacement(towerButton));
}

function enterButtonHoverState(button) {
    button.setTint(0xd3d3d3);
}
 function enterButtonRestState(button) {
    button.setTint(0xffffff);
}

function selectTowerForPlacement(towerButton) {
    placing = true;
    switch(towerButton.texture.key)
    {
        case 'arrow':
            selectedTurret = "Arrow";
            break;
        case 'bomb':
            selectedTurret = "Bomb";
            break;
        case 'fire':
            selectedTurret = "Fire";
            break;
        case 'ice':
            selectedTurret = "Ice";
            break;
    }
}

function followMousePointer(scene, sprite) {
    sprite.x = scene.input.activePointer.x;
    sprite.y = scene.input.activePointer.y;
}

function escapePlaceMode() {
    placing = false;
}

function create() {
    // Load and parse map data
    level1 = this.cache.text.get('level1');
    level2 = this.cache.text.get('level2');
    level3 = this.cache.text.get('level3');
    levelMap1 = parseMap(level1);
    levelMap2 = parseMap(level2);
    levelMap3 = parseMap(level3);
    levelPath1 = generatePaths(levelMap1);

    // Set up tilemap using Kenney sprite sheet
    const tilemap = this.make.tilemap({ data: levelMap1.tiles, tileWidth: 64, tileHeight: 64 });
    const tileset = tilemap.addTilesetImage("tdtiles");
    const layer = tilemap.createStaticLayer(0, tileset, 0, 0); // layer index, tileset, x, y

    this.add.image(26, 28, 'goldCoin');
    this.add.image(MAPWIDTH - 56, 28, 'heart');
    goldText = this.add.text(42, 16, '200', {fontSize: '24px', fontStyle: 'Bold'});
    lifeText = this.add.text(MAPWIDTH - 40, 16, '20', {fontSize: '24px', fontStyle: 'Bold'});
    this.waveText = this.add.text(480, 16, "Wave 1", {fontSize:'24px', fontStyle: 'Bold'});
    
    //add two buttons for selling and upgrading towers.
    upgradeText = this.add.text(0,0, '', {fontSize: '12px', fill: '#ffffff', align:'center'});
    upgradeButton = this.add.image(0,0,'upgradeButton').setActive(false).setVisible(false);
    sellText = this.add.text(0,0, '', {fontSize: '12px', fill: '#ffffff', align:'center'});
    sellButton = this.add.image(0,0,'sellButton').setActive(false).setVisible(false);
    upgradeContainer = this.add.container();
    sellContainer = this.add.container();


    // this graphics element is only for visualization,
    // its not related to our path
    var graphics = this.add.graphics();

    let waveText = this.cache.text.get('waveText');

    this.waveData = parseWaveText(waveText);

    // TODO: Clean this up; manually creating levels for now.
    var startx = levelPath1[0][0][0] * TILESIZE + TILESIZE / 2
    var starty = levelPath1[0][0][1] * TILESIZE + TILESIZE / 2
    path = this.add.path(startx, starty)

    // TOOO: combine map data and functionality into an object as much as possible
    function makePath(pathStart, levelPath){
        // Make path with Phaser based on return value of generatePaths()
        for (var i = 0; i < levelPath.length; i++){
            var curr = levelPath[i];
            pathx = curr[0] * TILESIZE + TILESIZE / 2
            pathy = curr[1] * TILESIZE + TILESIZE / 2
            pathStart.lineTo(pathx, pathy)
        }
    }
    makePath(path, levelPath1[0]);

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

    // create ice explosion animation and group
    var frameNames = this.anims.generateFrameNames('iceExplosion',{
        start: 1, end: 19, suffix:'.png'
    })
    this.anims.create({key:'explode', frames:frameNames, frameRate:50, hideOnComplete: true})
    iceExplosions = this.add.group();
    for (var i = 0; i < 30; i++) { //shouldnt have more than 30 simultaneous explosions.
        var sprite = iceExplosions.create(0,0,'iceExplosion','1.png')
        sprite.setVisible(false);
    }


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
    this.input.keyboard.on('keydown_' + 'ESC', escapePlaceMode);

    //Cancel: ESC message
    this.cancel_msg_1 = this.add.text(965,485,'',{fontStyle: 'Bold'});
    this.cancel_msg_2 = this.add.text(973,495,'',{fontSize: '24px', fontStyle: 'Bold'});

    // Arrow tower button
    this.add.text(970, 80, 'Arrow');
    this.add.text(980, 155, "$" + arrowData.cost.level_1);
    this.arrowTowerButton = this.add.image(995, 125, 'arrow');
    addButtonInput(this.arrowTowerButton);

     // Bomb tower button
    this.add.text(975, 180, 'Bomb');
    this.add.text(975, 245, "$" + bombData.cost.level_1);
    this.bombTowerButton = this.add.image(995, 225, 'bomb');
    addButtonInput(this.bombTowerButton);
    
    // Fire tower button
    this.add.text(975, 275, 'Fire');
    this.add.text(975, 350, "$" + fireData.cost.level_1);
    this.fireTowerButton = this.add.image(995, 320, 'fire');
    addButtonInput(this.fireTowerButton);

    // Ice tower button
    this.add.text(981, 380, 'Ice');
    this.add.text(975, 455, "$" + iceData.cost.level_1);
    this.iceTowerButton = this.add.image(995, 425, 'ice');
    addButtonInput(this.iceTowerButton);

    // Tower sprites that will follow mouse pointer when UI button is clicked
    this.tempArrowTower = this.add.image(0, 0, 'arrow');
    this.tempBombTower = this.add.image(0, 0, 'bomb');
    this.tempFireTower = this.add.image(0, 0, 'fire');
    this.tempIceTower = this.add.image(0, 0, 'ice');
    
    var graphicsArrow = this.add.graphics();
    var graphicsBomb = this.add.graphics();
    var graphicsFire = this.add.graphics();
    var graphicsIce = this.add.graphics();
    // Change alpha to 1 for white, 0 for transparent
    graphicsArrow.lineStyle(2, 0xffffe0, 1);
    graphicsBomb.lineStyle(2, 0xffffe0, 1);
    graphicsFire.lineStyle(2, 0xffffe0, 1);
    graphicsIce.lineStyle(2, 0xffffe0, 1);

    // Generate tower range indicators
    this.arrowCircle = graphicsArrow.strokeCircle(0, 0, arrowData.range.level_1);
    this.bombCircle = graphicsBomb.strokeCircle(0, 0, bombData.range.level_1);
    this.fireCircle = graphicsFire.strokeCircle(0, 0, fireData.range.level_1);
    this.iceCircle = graphicsIce.strokeCircle(0, 0, iceData.range.level_1);

    // Hide all sprites initially
    this.tempArrowTower.setVisible(false);
    this.arrowCircle.setVisible(false);
    this.tempBombTower.setVisible(false);
    this.bombCircle.setVisible(false);
    this.tempIceTower.setVisible(false);
    this.iceCircle.setVisible(false);
    this.tempFireTower.setVisible(false);
    this.fireCircle.setVisible(false);

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

    if (placing == true){
        this.cancel_msg_1.setText('Cancel')
        this.cancel_msg_2.setText('ESC')
        switch(selectedTurret) {
            case "Arrow":
                // Make the tower and it's range visible
                this.tempArrowTower.setVisible(true);
                this.arrowCircle.setVisible(true);
                // Make the sprite and circle follow the mouse pointer
                followMousePointer(this, this.tempArrowTower);
                followMousePointer(this, this.arrowCircle);
                break;
            case "Bomb":
                this.tempBombTower.setVisible(true);
                this.bombCircle.setVisible(true);
                followMousePointer(this, this.tempBombTower);
                followMousePointer(this, this.bombCircle);
                break;
            case "Ice":
                this.tempIceTower.setVisible(true);
                this.iceCircle.setVisible(true);
                followMousePointer(this, this.tempIceTower);
                followMousePointer(this, this.iceCircle);
                break;
            case "Fire":
                this.tempFireTower.setVisible(true);
                this.fireCircle.setVisible(true);
                followMousePointer(this, this.tempFireTower);
                followMousePointer(this, this.fireCircle);
        }
    }

    if (placing == false) {
        this.cancel_msg_1.setText('');
        this.cancel_msg_2.setText('');
        this.tempArrowTower.setVisible(false);
        this.arrowCircle.setVisible(false);
        this.tempBombTower.setVisible(false);
        this.bombCircle.setVisible(false);
        this.tempIceTower.setVisible(false);
        this.iceCircle.setVisible(false);
        this.tempFireTower.setVisible(false);
        this.fireCircle.setVisible(false);
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
