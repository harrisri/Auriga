const SPEED_SCALE = 15;
const BUILD = '#';
const NOBUILD = '^';
const OPEN = '-';
const START = ['0', '1', '2']
const END = ['9', '8', '7']
const TILESIZE = 64;
const MAPHEIGHT = TILESIZE * 12;
const MAPWIDTH = TILESIZE * 17;
const COLUMN_N = 16;
const ROW_N = 12;
const SELL_PERCENTAGE = 0.8;

const ICE_MAX_CHANCE = 0.20; //chance to freeze enemy in place at MAX ice level.
const ICE_MAX_DURATION = 2000; //time frozen in place after successful freeze in ms.
const FIRE_MAX_CHANCE = 0.01; //chance to incinerate enemy @ MAX Fire level

var path;
var path2;
var goldText;
var lifeText;
var explosion;

var selectedTurret = "";
// Controls whether to display a turret sprite on mouse pointer
var placing = false;
// used to check if we need to delete upgrade and sell buttons.
var upgradeSellX = 0;
var upgradeSellY = 0;
var currentLevel = "";

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

        startOnPath: function (path)
        {
            this.path = path;
            // set the t parameter at the start of the path
            this.follower.t = 0;

            // get x and y of the given t point
            this.path.getPoint(this.follower.t, this.follower.vec);

            // set the x and y of our enemy to the received from the previous step
            this.setPosition(this.follower.vec.x, this.follower.vec.y);

            this.hp = data['base_hp'];

            //had to move this down here because some enemies were not getting healthbars.  I believe it is because
            //enemy sprites are reused and their hp is not corrected until the above statement resetting their hp when placed on the path.
            this.healthBar = new HealthBar(this.scene);
            this.healthBar.getBaseHP(this.hp);
            this.healthBar.bar.setPosition(this.x - 18, this.y - 20);
            this.healthBar.bar.setDepth(5);
            this.healthBar.draw()

            //shrink up the hitbox a bit.
            this.body.setCircle(20);
            this.depth = 1;
        },

        receiveDamage: function(damage, slow, duration, fire) {
            //fire damage ignores armor.
            if (fire) {
                this.hp = this.hp - damage;
            }
            else{
                this.hp =  this.hp - (damage - this.armor);
            }
            this.healthBar.setHealth(this.hp);
            this.healthBar.draw();
            //tint red when taking damage
            if (!this.slowed) {
                this.setTint(0xffb2b2)
                this.damageTimer = this.time + 100;
            }

            if (!this.slowed && slow > 0) {
                this.originalSpeed = this.speed;
                this.speed = this.speed * (1-slow);
                this.slowed = true;
                this.slowTimer = this.time + duration;
                this.setTint(0x87CEFA);
            }

            // if hp drops below 0 we deactivate this enemy
            if(this.hp <= 0) {
                this.setActive(false);
                this.setVisible(false);
                this.healthBar.bar.destroy();
                this.healthBar.destroy();
                gold += this.gold;
                goldText.setText(gold);
            }
        },

        update: function (time, delta)
        {
            this.time = time; //used for slow/damage timers

            //damage tint timer is up
            if (time > this.damageTimer && !this.slowed) {
                this.setTint(0xffffff);
            }

            //no longer slowed, set to normal color.
            if (this.slowed && time > this.slowTimer) {
                this.speed = this.originalSpeed;
                this.slowed = false;
                this.setTint(0xffffff);
            }

            // move the t point along the path, 0 is the start and 1 is the end
            this.follower.t += (this.speed/this.path.getLength()) * delta;

            // get the new x and y coordinates in vec
            this.path.getPoint(this.follower.t, this.follower.vec);

            //rotate to face correct direction
            var angle = Phaser.Math.Angle.Between(this.x, this.y, this.follower.vec.x, this.follower.vec.y);
            this.setRotation(angle);

            // update enemy x and y to the newly obtained x and y
            this.setPosition(this.follower.vec.x, this.follower.vec.y);

            if (this.hp > 0)
            {
                this.healthBar.bar.setPosition(this.x - 18, this.y - 20);
            }

            // if we have reached the end of the path, remove the enemy
            if (this.follower.t >= 1)
            {
                this.destroy();
                // this.setActive(false);
                // this.setVisible(false);
                this.healthBar.bar.destroy();
                this.healthBar.destroy();
                life -= 1;
                lifeText.setText(life);
            }
        }
    });

    return Enemy;
}

var HealthBar = new Phaser.Class({
    Extends: Phaser.GameObjects.Graphics,

    initialize:
    function HealthBar (scene)
    {
        this.bar = new Phaser.GameObjects.Graphics(scene);
        this.baseHealth;
        this.currHealth;
        this.percentageHealth = 100;
        scene.add.existing(this.bar);
    },

    getBaseHP (baseHP)
    {
        this.baseHealth = baseHP;
        this.currHealth = baseHP;
    },

    setHealth (newHealth)
    {
        this.currHealth = newHealth;
        this.percentageHealth = this.currHealth/this.baseHealth*100;
    },

    draw()
    {
        this.bar.clear();

        if (this.percentageHealth > 50) {
            this.bar.fillStyle(0x00ff00);
        }
        if (this.percentageHealth <= 50 && this.percentageHealth >= 30) {
            this.bar.fillStyle(0xffa500);
        }
        if (this.percentageHealth < 30) {
            this.bar.fillStyle(0xff0000);
        }

        this.bar.fillRect(this.x + 6, this.y, this.percentageHealth/5, 3);
    }
});

function generateTowerClass(data){

    var Tower = new Phaser.Class({

        Extends: Phaser.GameObjects.Image,

        initialize:
        function Tower (scene)
        {
            Phaser.GameObjects.Image.call(this, scene, 0, 0, data.name);

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
            this.rangeGraphic = new Phaser.GameObjects.Graphics(scene);
            this.upgradeRangeGraphic = new Phaser.GameObjects.Graphics(scene);
            this.upgradeRangeGraphic.lineStyle(2, 0xffffe0, 1);
            this.rangeGraphic.lineStyle(2, 0xffffe0, 1);
            scene.add.existing(this.rangeGraphic);
            scene.add.existing(this.upgradeRangeGraphic);
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
            if (this.level === 4){
                if (this.name === 'bomb') {
                    this.target = 'air-ground'
                }
                if (this.name === 'arrow') {
                    this.target = 'air'
                }
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

        getSellPrice: function(){
            var total = 0;
            for (var i = 1; i < this.level + 1; i++) {
                levelKey = 'level_' + i;
                total = total + data['cost'][levelKey]
            }
            return Math.round(total * SELL_PERCENTAGE);
        },

        getUpgradeRange: function(){
            var level = this.level;
            if (this.level <=3) {
                level++;
            }
            var levelKey = 'level_' + level;
            return data['range'][levelKey];
        },

        getUpgradeInformation: function(){
            // Crazy function that loops through provided tower's json data and looks for upgrades.
            // returns a string with upgrade information to be displayed on info button.

            var currentlevelKey = 'level_' + this.level
            var nextlevelKey = 'level_' + (this.level + 1);

            var info = '';
            if (this.name === 'fire') {
                info = info + 'Drops 1 Additional Fire.\n'
            }
            //loop through data and find anything that would be upgraded
            for (var key in data) {
                if (data.hasOwnProperty(key)) {

                    if (this.level === 3 && key === 'final_ability') {
                        info = info + 'Final Ability!' + '\n' + data[key] + '\n'
                    }
                    if (typeof(data[key]) === 'object')  {
                        //rate is a special case where having a lower number is better.  If rate drops, add to info
                        if (key === 'rate') {
                            if (data[key][currentlevelKey] > data[key][nextlevelKey]){
                                info = info + key.charAt(0).toUpperCase() + key.slice(1) + '\n' + data[key][currentlevelKey] + ' -> ' + data[key][nextlevelKey] + '\n'
                            }
                        }
                        //check if an upgrade to the key occurs.  If so, add that info
                        else if (data[key][currentlevelKey] < data[key][nextlevelKey]) {
                            if (key != 'cost') { //no need to include cost.
                                //special cases where keys could be more descriptive based on tower type.  EX: Slow Duration vs. Fire Duration.  Duration itself isnt intuitive.
                                if (this.name === 'bomb' && key === 'radius') {
                                    info = info + 'Blast Radius' + '\n' + data[key][currentlevelKey] + ' -> ' + data[key][nextlevelKey] + '\n'
                                }
                                else if (this.name === 'ice' && key === 'duration') {
                                    info = info + 'Slow Duration' + '\n' + data[key][currentlevelKey] + ' -> ' + data[key][nextlevelKey] + '\n'
                                }
                                else if (this.name === 'ice' && key === 'slow') {
                                    info = info + 'Slow Percentage' + '\n' + (100*data[key][currentlevelKey]) + '% -> ' + (100*data[key][nextlevelKey]) + '%\n'
                                }
                                else if (this.name === 'fire' && key === 'duration') {
                                    info = info + 'Fire Duration' + '\n' + data[key][currentlevelKey] + ' -> ' + data[key][nextlevelKey] + '\n'
                                }
                                else{
                                    info = info + key.charAt(0).toUpperCase() + key.slice(1) + '\n' + data[key][currentlevelKey] + ' -> ' + data[key][nextlevelKey] + '\n'
                                }
                            }
                        }
                    }
                }
            }
            //remove ending newline
            info = info.replace(/\n$/, "");
            return info;
        },

        fire: function() {
            var enemy = getEnemy(this.x, this.y, this.range, this.target);
            if(enemy && enemy.follower.t < 1) {
                var leadTarget = { t: enemy.follower.t, vec: new Phaser.Math.Vector2() };
                //'lead' the target by shooting at a point 0.6% ahead of where the enemy is currently.
                var distance = Phaser.Math.Distance.Between(enemy.x,enemy.y,this.x, this.y)
                if ((enemy.name === 'speedy' && distance > 75) || distance > 150){
                    console.log('leading target!')
                    if (leadTarget.t + 0.006 <= 1) {
                        leadTarget.t += 0.006
                    }
                    else{
                        leadTarget.t = 1;
                    }
                }

                enemy.path.getPoint(leadTarget.t, leadTarget.vec);
                //calculate the angle in which the projectile will shoot.  Also, the angle that the turret will face.
                var angle = Phaser.Math.Angle.Between(this.x, this.y, leadTarget.vec.x, leadTarget.vec.y);
                this.angle = (angle + Math.PI/2) * Phaser.Math.RAD_TO_DEG;
                addProjectile(enemy, this.name, this.level, this.x, this.y, this.range, angle, this.damage, this.radius, this.duration);
            }
        },

        iceFire: function() {
            var speedy = speedyGroup.getChildren();
            var enemyUnits = speedy.concat(heavyGroup.getChildren(), flyingGroup.getChildren(), infantryGroup.getChildren());

            for(var i = 0; i < enemyUnits.length; i++) {
                if(enemyUnits[i].active && Phaser.Math.Distance.Between(this.x, this.y, enemyUnits[i].x, enemyUnits[i].y) <= this.range){
                        iceExplosion(this.x, this.y);
                        var freeze = Math.random().toFixed(2);
                        if (this.level == 4 && freeze <= ICE_MAX_CHANCE) {
                            enemyUnits[i].receiveDamage(this.damage, 1, ICE_MAX_DURATION);
                        }
                        else{
                            enemyUnits[i].receiveDamage(this.damage, this.slow, this.duration);
                        }
                }
            }
        },
        // we will place the turret according to the grid
        place: function(i, j, levelMap) {
            this.y = i * TILESIZE + TILESIZE/2;
            this.x = j * TILESIZE + TILESIZE/2;
            levelMap.grid[i][j] = 'X';

            gold -= this.cost;
            goldText.setText(gold);
            this.nextTic = 0;
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
        this.damage = 0;
        this.xOrigin = 0;
        this.yOrigin = 0;
        this.range = 0;
        this.homingTarget = null;
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
    },

    homingFire: function(x, y, enemy){
        this.homingTarget = enemy;
        this.setPosition(x, y);
    },

    update: function (time, delta)
    {
        if (this.homingTarget) {
            
            if (this.homingTarget.hp <= 0) {  //need to retarget!
                this.homingTarget = getEnemy(this.xOrigin, this.yOrigin, this.range, "air-ground")
            }

            //for some reason, the collision isnt always detected.  This manually acts as the collision. 
            if (Phaser.Math.Distance.Between(this.homingTarget.x, this.homingTarget.y, this.x, this.y) < 15) {
                damageEnemy(this.homingTarget, this);
                this.setActive(false);
                this.setVisible(false);
            }

            var angle = Phaser.Math.Angle.Between(this.x, this.y, this.homingTarget.x, this.homingTarget.y);
            this.angle = (angle + Math.PI/2) * Phaser.Math.RAD_TO_DEG;
            this.dx = Math.cos(angle);
            this.dy = Math.sin(angle);
        }

        this.x += this.dx * (this.speed * delta);
        this.y += this.dy * (this.speed * delta);

        if (Phaser.Math.Distance.Between(this.xOrigin, this.yOrigin, this.x, this.y) > this.range + 100) {
            this.setActive(false);
            this.setVisible(false);
        }

        if (allEnemiesDead()) {
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
        var size = this.getBounds();
        this.setDisplaySize((size.width * 1.4), (size.height * 1.4));
    },

    getDropCoords(level){
        var dropCoords = [];
        switch (level){
            case 1:
                dropCoords.push(0);
                break;
            case 2:
                dropCoords.push(-0.004);
                dropCoords.push(0.004);
                break;
            case 3:
                dropCoords.push(-0.008);
                dropCoords.push(0);
                dropCoords.push(0.008);
                break;
            case 4:
                dropCoords.push(-0.012);
                dropCoords.push(-0.004);
                dropCoords.push(0.004);
                dropCoords.push(0.012);
                break;
        }
        return dropCoords;
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

function addProjectile(enemyTarget, name, level, x, y, range, angle, damage, radius, duration) {
    var projectile = Projectiles.get();
    projectile.xOrigin = x;
    projectile.yOrigin = y;
    projectile.range = range;
    switch(name){
        //change projectile sprite if needed
        case 'arrow':
            projectile.setTexture('bullet');
            break;
        case 'bomb':
            projectile.setTexture('missile')
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
        projectile.level = level;
        if (name === 'bomb' && level === 4) {
            projectile.homingFire(x, y, enemyTarget);
        }
        else{
            projectile.fire(x, y, angle);
        }
    }
}

function getEnemy(x, y, distance, turret_target) {
    //get ALL enemies
    var speedy = speedyGroup.getChildren();
    var enemyUnits = speedy.concat(heavyGroup.getChildren(), flyingGroup.getChildren(), infantryGroup.getChildren());

    //sort to always shoot at the furthest enemy down the path!
    enemyUnits.sort(function(a,b){
        return b.follower.t - a.follower.t
    });

    for(var i = 0; i < enemyUnits.length; i++) {
        if(enemyUnits[i].active && enemyUnits[i].hp > 0 && Phaser.Math.Distance.Between(x, y, enemyUnits[i].x, enemyUnits[i].y) <= distance){
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
            if (bullet.level != 4) {
                var enemyUnits = speedy.concat(heavyGroup.getChildren(), infantryGroup.getChildren());
            }
            else{
                var enemyUnits = speedy.concat(heavyGroup.getChildren(), flyingGroup.getChildren(), infantryGroup.getChildren());
            }

            for(var i = 0; i < enemyUnits.length; i++) {
                if(enemyUnits[i].active && Phaser.Math.Distance.Between(enemy.x, enemy.y, enemyUnits[i].x, enemyUnits[i].y) <= bullet.radius){
                    enemyUnits[i].receiveDamage(bullet.damage);
                }
            }
        }

        else if (bullet.name == 'fire'){
            //get the drop coordinates for the fire depending on level.
            var dropCoords = GroundFireGroup.get().setActive(false).getDropCoords(bullet.level);

            //current location of the hit enemy
            var pathLocation = { t: enemy.follower.t, vec: new Phaser.Math.Vector2() };

            //drop ground fire around the enemy!
            for (var i = 0; i < dropCoords.length; i++) {
                //move the location on the path a certain percentage dictated by getDropCoords()
                pathLocation.t += dropCoords[i];
                enemy.path.getPoint(pathLocation.t, pathLocation.vec);

                //get a groundfire object, and drop it on the map.
                var fire = GroundFireGroup.get();
                fire.setPosition(pathLocation.vec.x, pathLocation.vec.y)
                fire.damage = bullet.damage;
                fire.lifespan = bullet.duration;
                fire.level = bullet.level;
                fire.body.setCircle(10);
                fire.setVisible(true);
                fire.setActive(true);
                fire.setDepth(0)

                //reset the t value for next fire drop
                pathLocation.t = enemy.follower.t;
            }
            //initial hit damage from fire bullet. Only if they are air.
            if (enemy.moveType != 'air') {
                enemy.receiveDamage(bullet.damage,0,0,true); //fire damage ignores armor
            }
        }

        else{
            enemy.receiveDamage(bullet.damage);
        }
    }
}

function groundFireDamageEnemy(enemy, groundFire){
    if (enemy.moveType != 'air') {
        if (enemy.active === true && groundFire.active === true) {
            var incinerate = Math.random().toFixed(2);
            if (groundFire.level == 4 && incinerate <= FIRE_MAX_CHANCE) {
                enemy.receiveDamage(10000, 0, 0, true);
            }
            else{
                enemy.receiveDamage(groundFire.damage/100, 0, 0, true) //base damage is way overpowered., fire damage ignores armor.
            }
        }
    }
}

function placeTurret(pointer, levelMap) {
    var i = Math.floor(pointer.y/TILESIZE);
    var j = Math.floor(pointer.x/TILESIZE);

    //check if user clicked away from upgrades/sell buttons.
    if (upgradeSellX != j || upgradeSellY != i) {
        cleanUpButtons();
    }

    if (placing == true)
    {
        if(canPlaceTurret(i, j, levelMap)) {
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
                    turret.place(i, j, levelMap);

                    //put a star below turret
                    addTowerStar(turret);

                    //make tower interactive
                    makeTowerButtonsInteractive('tower', turret, null, levelMap);
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

function canPlaceTurret(i, j, levelMap) {
    return levelMap.grid[i][j] === BUILD;
}

function showUpgradeAndSell(tower, levelMap){
    // handler function for when a user clicks on a placed tower.
    // expects the tower to be passed in as it is required for getting upgrade/sell prices.

    //handles case where user clicks on multiple towers in a row.
    if (ButtonsGroup.getChildren().length > 0) {
        cleanUpButtons();
    }

    //button placement variables
    var down = tower.y + 50;
    var left = tower.x - 33
    var right = tower.x + 33;

    if (down > MAPHEIGHT) {
        down = tower.y - 50;
    }

    if (left < 0) {
        left = tower.x;
        right = tower.x + 66;   
    }

    if (right > MAPWIDTH) {
        left = tower.x - 66;
        right = tower.x;
    }


    //create sell button
    var sellButton = ButtonsGroup.get(right,down,'sellButton',null,true);
    this.sellText.setText("Sell\n$"+ tower.getSellPrice()).setPosition(right,down).setOrigin(0.5,0.5);

    //create upgrade button.
    var upgradeButton = ButtonsGroup.get(left,down,'upgradeButton',null,true);
    this.upgradeText.setPosition(left,down).setOrigin(0.5,0.5);

    if (tower.level === 4) {
        this.upgradeText.setText("MAX")
    }
    else{
        this.upgradeText.setText("Upgrade\n$"+tower.getUpgradeCost());
    }

    if (tower.level != 4) {
        var buttonSize = this.upgradeText.getBounds();
        upgradeButton.setDisplaySize(buttonSize.width + 5, buttonSize.height + 5);
        sellButton.setDisplaySize(buttonSize.width + 5, buttonSize.height + 5);
    }


    //setting the depth to an integer (semi random in this case) makes it so enemies are not shown over the buttons/text.
    this.sellText.depth = 11;
    sellButton.depth = 10;
    upgradeButton.depth = 10;
    this.upgradeText.depth = 11;

    //make these buttons interactive.
    makeTowerButtonsInteractive('upgrade', upgradeButton, tower, levelMap);
    makeTowerButtonsInteractive('sell', sellButton, tower, levelMap);

    //coords for hiding buttons when player clicks away.
    upgradeSellX = Math.floor(tower.x/TILESIZE);
    upgradeSellY = Math.floor(tower.y/TILESIZE);
}

function makeTowerButtonsInteractive(type, button, tower, levelMap){
    // function used to make tower, sell, and upgrade buttons interactive.
    // each button gets its own function upon clicking.

    button.setInteractive();
    switch(type)
    {
        case 'tower':
            // button.on('pointerover', () => enterButtonHoverState(button));
            button.on('pointerover', () => towerHoverState(button));
            button.on('pointerover', () => enterButtonHoverState(button));
            button.on('pointerdown', () => showUpgradeAndSell(button, levelMap));
            button.on('pointerout', () => towerRestState(button));
            break;
        case 'upgrade':
            button.on('pointerdown', () => upgradeTower(button, tower));
            button.on('pointerover', () => showUpgradeInfo(button,tower));
            button.on('pointerout', () => hideUpgradeInfo(button,tower));
            break;
        case 'sell':
            button.on('pointerdown', () => sellTower(button, tower, levelMap));
            button.on('pointerover', () => enterButtonHoverState(button));
            button.on('pointerout', () => enterButtonRestState(button));
            break;
    }
}

function towerHoverState(tower){
    tower.setTint(0xd3d3d3);
    tower.rangeGraphic.strokeCircle(tower.x, tower.y, tower.range);
    tower.rangeGraphic.setVisible(true)
    tower.upgradeRangeGraphic.setVisible(false);
}

function towerRestState(tower){
    tower.setTint(0xffffff);
    tower.rangeGraphic.setVisible(false);
}

function showUpgradeInfo(button, tower){
    towerRestState(tower);
    if (tower.level < 4) {
        button.setTint(0xd3d3d3);
        tower.upgradeRangeGraphic.strokeCircle(tower.x, tower.y, tower.getUpgradeRange())
        tower.upgradeRangeGraphic.setVisible(true);
        
        this.upgradeInfoText.setText(tower.getUpgradeInformation());
        this.upgradeInfoText.depth = 11;
        upgradeInfoButton.depth = 10;

        var buttonSize = this.upgradeInfoText.getBounds();
        upgradeInfoButton.setDisplaySize(buttonSize.width + 5, buttonSize.height + 10);
        
        var upgradeButtonBounds = button.getBounds();
        var infoButtonBounds = upgradeInfoButton.getBounds();

        var y = upgradeButtonBounds.bottom + infoButtonBounds.height/2 + 10;
        var x = button.x;

        //set initial position
        upgradeInfoButton.setPosition(x,y)

        //check if info popup has appeared off screen. Adjust x,y accordingly.
        //too low
        if (upgradeInfoButton.getBounds().bottom > MAPHEIGHT) {
            y = upgradeButtonBounds.top - infoButtonBounds.height/2 - 10;
        }

        //too far left
        if (upgradeInfoButton.getBounds().left < 0){
            x = infoButtonBounds.width/2 + 10;
        } 

        //too far right
        if (upgradeInfoButton.getBounds().right > MAPWIDTH){
            x = MAPWIDTH - infoButtonBounds.width/2 - 10;
        } 

        //reset position since x,y may have changed.
        upgradeInfoButton.setPosition(x,y)
        this.upgradeInfoText.setPosition(x,y).setOrigin(0.5,0.5);

        upgradeInfoButton.setVisible(true);
    }
}

function hideUpgradeInfo(button,tower){
    button.setTint(0xffffff);
    this.upgradeInfoText.setText('')
    upgradeInfoButton.setVisible(false);
    tower.upgradeRangeGraphic.setVisible(false);
}

function upgradeTower(button, tower){
    // If the player has enough money, the tower is upgraded to the next level.
    // An additional star is added upon successful upgrade.

    if ((gold - tower.getUpgradeCost()) >= 0) {
        gold -= tower.getUpgradeCost();
        goldText.setText(gold);
        tower.upgrade();

        //clean up ui elements
        cleanUpButtons();
        removeTowerStar(tower); //clear existing star
        addTowerStar(tower);

        tower.rangeGraphic.clear();
        tower.upgradeRangeGraphic.clear();
        tower.rangeGraphic.lineStyle(2, 0xffffe0, 1);
        tower.upgradeRangeGraphic.lineStyle(2, 0xffffe0, 1);
        tower.rangeGraphic.strokeCircle(tower.x, tower.y, tower.range)
        tower.upgradeRangeGraphic.strokeCircle(tower.x, tower.y, tower.getUpgradeRange())
        tower.rangeGraphic.setVisible(false);
        tower.upgradeRangeGraphic.setVisible(false);
    }
        tower.upgradeRangeGraphic.setVisible(false);
        upgradeInfoButton.setVisible(false);
        this.upgradeInfoText.setText('')
}

function sellTower(button, tower, levelMap){
    // Function attached to sell tower button.
    // Subtracts from the gold total a percentage of the total money spent on the tower.
    // removes the tower from the map.

    // Add percentage of tower cost to gold.
    gold += tower.getSellPrice();
    goldText.setText(gold);

    // Clear out space for placing new towers.
    var i = Math.floor(tower.y/TILESIZE);
    var j = Math.floor(tower.x/TILESIZE);
    levelMap.grid[i][j] = BUILD;

    // Deactivate this tower.
    switch (tower.name){
        case 'arrow':
            arrowTurrets.remove(tower,true,true);
            break;
        case 'bomb':
            bombTurrets.remove(tower,true,true);
            break;
        case 'ice':
            iceTurrets.remove(tower,true,true);
            break;
        case 'fire':
            fireTurrets.remove(tower,true,true);
            break;
    }
    cleanUpButtons();
    removeTowerStar(tower);
}

function addTowerStar(tower){
    // Adds a star to the tower sprite depending on its level.

    var starImage = tower.level + '-star';
    var star = StarGroup.get(tower.x,tower.y + 25,starImage,null,true);
}

function removeTowerStar(tower){
    // Finds the x/y coords of the tile that is occupied by the tower.
    // Then loops through all stars on the map for a star that occupies the same tile and removes it.

    var tower_x = Math.floor(tower.x/TILESIZE);
    var tower_y = Math.floor(tower.y/TILESIZE);

    var stars = StarGroup.getChildren();
    for (var i = 0; i < stars.length; i++) {
        var star_x = Math.floor(stars[i].x/TILESIZE);
        var star_y = Math.floor(stars[i].y/TILESIZE);
        if (star_x == tower_x && star_y == tower_y) {
            StarGroup.remove(stars[i],true,true)
            break;
        }
    }
}

function cleanUpButtons(){
    // Clears out the upgrade/sell Texts- effectively making them invisible.
    // Removes upgrade/sell buttons from ButtonsGroup.  This hides any of these buttons from the map.

    this.upgradeText.setText('')
    this.sellText.setText('')
    var buttons = ButtonsGroup.clear(true,true);
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
        tiles[i].length = grid[i].length + 1;
        for (var j = 0; j < tiles[i].length; j++){
            char = grid[i][j]
            if (char === OPEN || start.includes(char) || end.includes(char)) {
                tiles[i][j] = 93; // Build-space tile in Kenney pack [2nd row 2nd column]
            }
            else if (char === NOBUILD){
                tiles[i][j] = 130; // Build-space tile in Kenney pack [2nd row 2nd column]
            }
            else if (char === BUILD){
                tiles[i][j] = 38; // Ground-space tile in Kenney pack [5th row 2nd column]
            }
            else if (j === grid[i].length){
                tiles[i][j] = 257;
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
                else if (temp === '9' || temp === '8' || temp === '7'){
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

function parseWaveData(waveData){
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

function titleSceneButtonInput(button) {
    button.setInteractive({ useHandCursor: true });
    button.on('pointerover', () => enterButtonHoverState(button));
    button.on('pointerout', () => enterButtonRestState(button));
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

var TitleScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize:
    function TitleScene ()
    {
        Phaser.Scene.call(this, { key: 'TitleScene' });
    },

    preload: function()
    {
        this.load.image('background','assets/background.png')
        this.load.image('level1map', 'assets/level1map.png');
        this.load.image('level2map', 'assets/level2map.png');
        this.load.image('level3map', 'assets/level3map.png');
    },

    create: function()
    {
        this.add.image(0, 0, 'background').setOrigin(0,0)
        var title = this.add.text(0, 25, "AURIGA TOWER DEFENSE", {fontFamily: 'Arial', fontSize: 35, fontStyle: 'Bold'});
        title.setPosition(MAPWIDTH/2 - title.getBounds().width/2, 30)

        // Create Text Buttons that load the new scenes
        this.level1Button = this.add.text(0, 90, "LEVEL 1", {fontFamily: 'Arial', fontSize: 18, fontStyle: 'Bold'});
        var levelTextX = MAPWIDTH/2 - this.level1Button.getBounds().width/2
        this.level1Button.setPosition(levelTextX, 90)
        titleSceneButtonInput(this.level1Button)
        this.level1Button.on('pointerdown', () => this.scene.start('LevelScene', {currentLevel:'level1'}));
        this.level1MapImage = this.add.image(MAPWIDTH/2, 200, "level1map").setScale(.15);
        this.level1MapImage.setInteractive({ useHandCursor: true });
        this.level1MapImage.on('pointerdown', () => this.scene.start('LevelScene', {currentLevel:'level1'}));
        titleSceneButtonInput(this.level1MapImage)

        this.level2Button = this.add.text(levelTextX, 300, "LEVEL 2", {fontFamily: 'Arial', fontSize: 18, fontStyle: 'Bold'});
        titleSceneButtonInput(this.level2Button);
        this.level2Button.on('pointerdown', () => this.scene.start('LevelScene', {currentLevel:'level2'}));
        this.level2MapImage = this.add.image(MAPWIDTH/2, 410, "level2map").setScale(.15);
        this.level2MapImage.setInteractive({ useHandCursor: true });
        this.level2MapImage.on('pointerdown', () => this.scene.start('LevelScene', {currentLevel:'level2'}));
        titleSceneButtonInput(this.level2MapImage)

        this.level3Button = this.add.text(levelTextX, 510, "LEVEL 3", {fontFamily: 'Arial', fontSize: 18, fontStyle: 'Bold'});
        titleSceneButtonInput(this.level3Button);
        this.level3Button.on('pointerdown', () => this.scene.start('LevelScene', {currentLevel:'level3'}));
        this.level3MapImage = this.add.image(MAPWIDTH/2, 620, "level3map").setScale(.15);
        this.level3MapImage.setInteractive({ useHandCursor: true });
        this.level3MapImage.on('pointerdown', () => this.scene.start('LevelScene', {currentLevel:'level3'}));
        titleSceneButtonInput(this.level3MapImage)

        this.instructionsButton = this.add.text(0, 745, "GAME INSTRUCTIONS", {fontFamily: 'Arial', fontSize: 30, fontStyle: 'Bold'});
        this.instructionsButton.setPosition(MAPWIDTH/2 - this.instructionsButton.getBounds().width/2, MAPHEIGHT - 50)
        titleSceneButtonInput(this.instructionsButton);
        this.instructionsButton.on('pointerdown', () => this.scene.start('InstructionsScene'));
    }
});

var InstructionsScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize:
    function InstructionsScene ()
    {
        Phaser.Scene.call(this, { key: 'InstructionsScene' });
    },
    preload: function(){
        this.load.image('infoscreen','assets/infoScreen.png')
    },
    create: function()
    {
        var background = this.add.image(0, 0, 'infoscreen').setOrigin(0,0).setScale(.648)
        background.setPosition(-8, 0)
        this.backButton = this.add.text(400, 650, "BACK TO TITLE SCREEN", {fontFamily: 'Arial', fontSize: 30, fontStyle: 'Bold'});
        this.backButton.setPosition(MAPWIDTH/2 - this.backButton.getBounds().width/2, MAPHEIGHT - 50);
        titleSceneButtonInput(this.backButton);
        this.backButton.on('pointerdown', () => this.scene.start('TitleScene'));
    }
});

var PauseScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize:
    function PauseScene ()
    {
        Phaser.Scene.call(this, { key: 'PauseScene' });
    },

    create: function()
    {
        // Create Pause Menu Buttons
        this.resumeGameButton = this.add.text(400, 250, "RESUME GAME", {fontFamily: 'Arial', fontSize: 30, fontStyle: 'Bold'});
        this.resumeGameButton.setPosition(MAPWIDTH/2 - this.resumeGameButton.getBounds().width/2, 250)
        titleSceneButtonInput(this.resumeGameButton)
        this.resumeGameButton.on('pointerdown', () => {
                this.scene.resume('LevelScene');
                this.scene.stop();
        });

        this.restartGameButton = this.add.text(400, 350, "RESTART LEVEL",{fontFamily: 'Arial', fontSize: 30, fontStyle: 'Bold'});
        this.restartGameButton.setPosition(MAPWIDTH/2 - this.restartGameButton.getBounds().width/2, 350)
        titleSceneButtonInput(this.restartGameButton);
        this.restartGameButton.on('pointerdown', () => {
                this.scene.restart('LevelScene');
                this.scene.start('LevelScene');
        });

        this.quitGameButton = this.add.text(400, 450, "QUIT GAME", {fontFamily: 'Arial', fontSize: 30, fontStyle: 'Bold'});
        this.quitGameButton.setPosition(MAPWIDTH/2 - this.quitGameButton.getBounds().width/2, 450)
        titleSceneButtonInput(this.quitGameButton);
        this.quitGameButton.on('pointerdown', () => {
            this.scene.stop();
            this.scene.stop('LevelScene');
            this.scene.start('TitleScene');
        });
    }
});

var HelpScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize:
    function HelpScene ()
    {
        Phaser.Scene.call(this, { key: 'HelpScene' });
    },
    preload: function(){
        this.load.image('infoscreen','assets/infoScreen.png')
    },

    create: function()
    {
        var background = this.add.image(0, 0, 'infoscreen').setOrigin(0,0).setScale(.648)
        background.setPosition(-8, 0)
        this.backButton = this.add.text(400, 650, "RESUME GAME", {fontFamily: 'Arial', fontSize: 30, fontStyle: 'Bold'});
        this.backButton.setPosition(MAPWIDTH/2 - this.backButton.getBounds().width/2, MAPHEIGHT - 50);
        titleSceneButtonInput(this.backButton);
        this.backButton.on('pointerdown', () => {
            this.scene.stop();
            this.scene.resume('LevelScene');
        });
    }
});

var YouWin = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize:
    function YouWin ()
    {
        Phaser.Scene.call(this, { key: 'YouWin' });
    },

    preload: function()
    {
        this.load.image('youWin', 'assets/youWin.png');
    },

    create: function()
    {
        this.WinImage = this.add.image(530, 400, 'youWin');
        this.WinImage.setScale(2);
        this.TitleReturnButton = this.add.text(350, 600, "RETURN TO MAIN MENU", { fontSize: 30 });
        titleSceneButtonInput(this.TitleReturnButton);
        this.TitleReturnButton.on('pointerdown', () => this.scene.start("TitleScene"));
    }
});

var GameOver = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize:
    function GameOver ()
    {
        Phaser.Scene.call(this, { key: 'GameOver' });
    },

    preload: function()
    {
        this.load.image('gameOver', 'assets/gameOver.png');
    },

    create: function()
    {
        this.GameOverImage = this.add.image(530, 400, 'gameOver');
        this.GameOverImage.setScale(2);
        this.TitleReturnButton = this.add.text(350, 600, "RETURN TO MAIN MENU", { fontSize: 30 });
        titleSceneButtonInput(this.TitleReturnButton);
        this.TitleReturnButton.on('pointerdown', () => this.scene.start("TitleScene"));
    }
})

var LevelScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize:
    function LevelScene ()
    {
        Phaser.Scene.call(this, { key: 'LevelScene' });
    },

    init: function(data){
        this.currentLevel = data.currentLevel
    },

    preload: function()
    {
        // Load Kenney assets tilemap
        this.load.image("tdtiles", "assets/2DTDassets/Tilesheet/towerDefense_tilesheet_modified.png")

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
        this.load.image('missile', 'assets/2DTDassets/PNG/Default size/towerDefense_tile252.png');

        // Load other sprites
        this.load.image('goldCoin', 'assets/goldCoin.png');
        this.load.image('heart', 'assets/heart.png');
        this.load.image('upgradeButton', 'assets/UpgradeButton.png')
        this.load.image('sellButton', 'assets/SellButton.png')
        this.load.image('upgradeInfoButton', 'assets/UpgradeInfoButton.png');
        this.load.image('1-star', 'assets/1Star.png')
        this.load.image('2-star', 'assets/2Star.png')
        this.load.image('3-star', 'assets/3Star.png')
        this.load.image('4-star', 'assets/4Star.png')
        this.load.spritesheet('icons', 'assets/icons_32x32.png', { frameWidth: 32, frameHeight: 32 });

        //load wave data
        this.load.text('wave1Data', 'data/waves/level1');
        this.load.text('wave2aData', 'data/waves/level2-a');
        this.load.text('wave2bData', 'data/waves/level2-b');
        this.load.text('wave3aData', 'data/waves/level3-a');
        this.load.text('wave3bData', 'data/waves/level3-b');

        //load ice tower explosion;
        this.load.setPath('assets/')
        this.load.multiatlas('iceExplosion','Ice_Explosion.json');
    },

    create: function()
    {
        gold = 2000;
        life = 20;

        this.secondPath = false;

        switch(this.currentLevel){
        //---------------------------LEVEL 1---------------------------------------
            case 'level1':
                var level = this.cache.text.get('level1');
                var waveData = this.cache.text.get('wave1Data');
                var waveData2 = null;
                this.secondPath = false;
                break;
        //---------------------------LEVEL 2---------------------------------------
            case 'level2':
                var level = this.cache.text.get('level2');
                //2 paths
                var waveData = this.cache.text.get('wave2aData');
                var waveData2 = this.cache.text.get('wave2bData');
                this.secondPath = true;
                break;
        //---------------------------LEVEL 2---------------------------------------
            case 'level3':
                var level = this.cache.text.get('level3');
                //2 paths
                var waveData = this.cache.text.get('wave3aData');
                var waveData2 = this.cache.text.get('wave3bData');
                // TODO: set second path to true once second path is built
                this.secondPath = false;
                break;
        }

        // Load and parse map data
        levelMap = parseMap(level)
        levelPath = generatePaths(levelMap);

        //set up wave text
        this.waveData = parseWaveData(waveData);
        if (waveData2 !== null) {
            this.waveData2 = parseWaveData(waveData2);
        }

        // Set up tilemap using Kenney sprite sheet
        const tilemap = this.make.tilemap({ data: levelMap.tiles, tileWidth: 64, tileHeight: 64 });
        const tileset = tilemap.addTilesetImage("tdtiles");
        const layer = tilemap.createStaticLayer(0, tileset, 0, 0); // layer index, tileset, x, y

        //UI elements
        this.add.image(26, 28, 'goldCoin');
        this.add.image(MAPWIDTH - 50, 28, 'heart');
        goldText = this.add.text(42, 15, '200', {fontFamily: 'Arial',fontSize: '24px', fontStyle: 'Bold'});
        lifeText = this.add.text(MAPWIDTH - 35, 15, '20', {fontFamily: 'Arial',fontSize: '24px', fontStyle: 'Bold'});
        this.waveText = this.add.text(MAPWIDTH - 640, 15, "Wave 1", {fontFamily: 'Arial',fontSize: '24px', fontStyle: 'Bold'});

        //below are used for upgrade/sell buttons.
        sellText = this.add.text(0,0, '', {fontFamily: 'Arial', fontSize: '14px', fill: '#ffffff', align:'center'});
        upgradeText = this.add.text(0,0, '', {fontFamily: 'Arial', fontSize: '14px', fill: '#ffffff', align:'center'});
        upgradeInfoText = this.add.text(0,0, '', {fontFamily: 'Arial',fontSize: '14px', fill: '#ffffff', align:'center'});
        upgradeInfoButton = this.add.image(0,0,'upgradeInfoButton').setVisible(false);
        ButtonsGroup = this.add.group();

        //group for putting stars under towers.
        StarGroup = this.add.group();

        // this graphics element is only for visualization,
        // its not related to our path
        var graphics = this.add.graphics();

        // TODO: Clean this up; manually creating levels for now.
        var path1StartX = levelPath[0][0][0] * TILESIZE + TILESIZE / 2
        var path1StartY = levelPath[0][0][1] * TILESIZE + TILESIZE / 2
        path = this.add.path(path1StartX, path1StartY);

        if (this.secondPath === true  && this.currentLevel != 'level3'){
            if (levelPath[1] !== []){
                var path2StartX = levelPath[1][0][0] * TILESIZE + TILESIZE / 2
                var path2StartY = levelPath[1][0][1] * TILESIZE + TILESIZE / 2
                path2 = this.add.path(path2StartX, path2StartY);
            }
        }

        if (this.currentLevel === 'level3') {
            //TODO: create manual second path for third level here.
            // var path2StartX = 8 * TILESIZE + TILESIZE / 2
            // var path2StartY = 2 * TILESIZE + TILESIZE / 2
            // var path2EndX = 16 * TILESIZE + TILESIZE / 2
            // var path2EndY = 2 * TILESIZE + TILESIZE / 2
            // path2 = this.add.path(path2StartX, path2StartY);
            // path2.lineTo(path2EndX,path2EndY);
        }

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
        makePath(path, levelPath[0]);
        if (this.secondPath === true){
            makePath(path2, levelPath[1]);
        }

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
        if (!this.anims.anims.has('explode')) {
            var frameNames = this.anims.generateFrameNames('iceExplosion',{
                start: 1, end: 19, suffix:'.png'
            })
            this.anims.create({key:'explode', frames:frameNames, frameRate:50, hideOnComplete: true})
        }

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
        this.input.on('pointerdown', function(pointer){placeTurret(pointer, levelMap)});
        this.input.keyboard.on('keydown_' + 'ESC', escapePlaceMode);

        //Cancel: ESC message
        this.cancel_msg_1 = this.add.text(MAPWIDTH - 59,485,'',{fontFamily: 'Arial',fontStyle: 'Bold'});
        this.cancel_msg_2 = this.add.text(MAPWIDTH - 56,499,'',{fontFamily: 'Arial',fontSize: '24px', fontStyle: 'Bold'});

        // Arrow tower button
        this.add.text(MAPWIDTH - 47, 80, 'Gun',{fontFamily: 'Arial',fontSize: '16px', fontStyle: 'Bold'});
        this.add.text(MAPWIDTH - 44, 155, "$" + arrowData.cost.level_1,{fontFamily: 'Arial',fontSize: '16px', fontStyle: 'Bold'});
        this.arrowTowerButton = this.add.image(MAPWIDTH - 29, 125, 'arrow');
        addButtonInput(this.arrowTowerButton);

        // Bomb tower button
        this.add.text(MAPWIDTH - 56, 180, 'Missile',{fontFamily: 'Arial',fontSize: '16px', fontStyle: 'Bold'});
        this.add.text(MAPWIDTH - 49, 245, "$" + bombData.cost.level_1,{fontFamily: 'Arial',fontSize: '16px', fontStyle: 'Bold'});
        this.bombTowerButton = this.add.image(MAPWIDTH - 29, 225, 'bomb');
        addButtonInput(this.bombTowerButton);

        // Fire tower button
        this.add.text(MAPWIDTH - 44, 275, 'Fire',{fontFamily: 'Arial',fontSize: '16px', fontStyle: 'Bold'});
        this.add.text(MAPWIDTH - 49, 350, "$" + fireData.cost.level_1,{fontFamily: 'Arial',fontSize: '16px', fontStyle: 'Bold'});
        this.fireTowerButton = this.add.image(MAPWIDTH - 29, 320, 'fire');
        addButtonInput(this.fireTowerButton);

        // Ice tower button
        this.add.text(MAPWIDTH - 41, 380, 'Ice',{fontFamily: 'Arial',fontSize: '16px', fontStyle: 'Bold'});
        this.add.text(MAPWIDTH - 49, 455, "$" + iceData.cost.level_1,{fontFamily: 'Arial',fontSize: '16px', fontStyle: 'Bold'});
        this.iceTowerButton = this.add.image(MAPWIDTH - 29, 425, 'ice');
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

        // Add pause and help icons
        this.pauseButton = this.add.image(MAPWIDTH - 44, 750, 'icons', 22);
        this.helpButton = this.add.image(MAPWIDTH - 14, 750, 'icons', 39);
        this.pauseButton.setInteractive();
        // on pauseButton click, pause LevelScene, start Pause Scene with resume, restart, and quit
        this.pauseButton.on('pointerdown', () => {
            this.scene.launch('PauseScene');
            this.scene.pause('LevelScene');
        });
        this.helpButton.setInteractive();
        // on helpButton click, pause LevelScene, start help Scene with back button
        this.helpButton.on('pointerdown', () => {
            this.scene.pause('LevelScene');
            this.scene.launch('HelpScene');
        });

        //variables to assist in spawning enemies in waves
        this.nextEnemy = 0;
        this.nextEnemy2 = 0;
        this.nextEnemyIndex = 0;
        this.nextEnemyIndex2 = 0;
        this.timeToNextEnemyIndex = 1;
        this.timeToNextEnemyIndex2 = 1;
        this.waveIndex = 0;
        this.showCountdown = false;
    },

    update: function(time, delta)
    {
        //first path
        if (time > this.nextEnemy)
        {
            this.showCountdown = false;
            this.waveText.setText("Wave " + (this.waveIndex + 1));
            this.waveText.x = MAPWIDTH / 2 - 68;
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
                enemy.startOnPath(path);
                enemy.setActive(true);
                enemy.setVisible(true);

                this.nextEnemy = time + this.waveData[this.waveIndex][this.timeToNextEnemyIndex];
                this.nextEnemyIndex += 2;
                this.timeToNextEnemyIndex += 2;
            }
        }

        //second Path
        if (this.secondPath) {
            if (time > this.nextEnemy2){
                this.showCountdown = false;
                this.waveText.x = MAPWIDTH / 2 - 68;
                this.waveText.setText("Wave " + (this.waveIndex + 1));
                var enemyType2 = this.waveData2[this.waveIndex][this.nextEnemyIndex2];
                var enemy2;
                switch(enemyType2){
                    case 'i':
                        enemy2 = infantryGroup.get()
                        break;
                    case 'h':
                        enemy2 = heavyGroup.get()
                        break;
                    case 'f':
                        enemy2 = flyingGroup.get()
                        break;
                    case 's':
                        enemy2 = speedyGroup.get()
                        break;
                }

                if (enemy2)
                {
                    enemy2.startOnPath(path2);
                    enemy2.setActive(true);
                    enemy2.setVisible(true);

                    this.nextEnemy2 = time + this.waveData2[this.waveIndex][this.timeToNextEnemyIndex2];
                    this.nextEnemyIndex2 += 2;
                    this.timeToNextEnemyIndex2 += 2;
                }
            }
        }
      
        //clean up temp circles/towers.  Moved out here to clean up in case user selects ui towers repeatedly.
        this.tempArrowTower.setVisible(false);
        this.arrowCircle.setVisible(false);
        this.tempBombTower.setVisible(false);
        this.bombCircle.setVisible(false);
        this.tempIceTower.setVisible(false);
        this.iceCircle.setVisible(false);
        this.tempFireTower.setVisible(false);
        this.fireCircle.setVisible(false);

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
        }

        if (this.showCountdown){
            var timer = Math.round((this.nextEnemy - time)/1000);
            this.waveText.setText("Next Wave in " + timer + "!")
            this.waveText.x = MAPWIDTH / 2 - 100;
        }

        if (this.secondPath) {
            if (this.waveIndex < this.waveData.length - 1 && this.waveIndex < this.waveData2.length -1) {
            //check if it's time for a new wave: all enemies dead, and there are no more enemies to spawn.
                if (this.timeToNextEnemyIndex >= this.waveData[this.waveIndex].length && this.timeToNextEnemyIndex2 >= this.waveData2[this.waveIndex].length && allEnemiesDead()) {
                    //time for a new wave!
                    this.nextEnemyIndex = 0;
                    this.timeToNextEnemyIndex = 1;
                    this.nextEnemyIndex2 = 0;
                    this.timeToNextEnemyIndex2 = 1;
                    this.waveIndex++;
                    this.nextEnemy = time + 10000; //10 sec until next wave
                    this.nextEnemy2 = time + 10000; //10 sec until next wave
                    this.showCountdown = true;
                }
            }
        }
        else{
            if (this.waveIndex < this.waveData.length - 1) {
                //check if it's time for a new wave: all enemies dead, and there are no more enemies to spawn.
                if (this.timeToNextEnemyIndex >= this.waveData[this.waveIndex].length && allEnemiesDead()) {
                    //time for a new wave!
                    this.nextEnemyIndex = 0;
                    this.timeToNextEnemyIndex = 1;
                    this.nextEnemyIndex2 = 0;
                    this.timeToNextEnemyIndex2 = 1;
                    this.waveIndex++;
                    this.nextEnemy = time + 10000; //10 sec until next wave
                    this.nextEnemy2 = time + 10000; //10 sec until next wave
                    this.showCountdown = true;
                }
            }
        }


        // Victory scene if all waves are completed
        if (allEnemiesDead() && (this.waveData.length - 1 === this.waveIndex)){
            this.scene.stop();
            this.scene.start('YouWin');
        }

        // GameOver Scene if player is out of lives
        if (life <= 0)
        {
            this.scene.stop();
            this.scene.start('GameOver');
        }
    }
});

var config = {
    type: Phaser.AUTO,
    parent: 'content',
    width: MAPWIDTH,
    height: MAPHEIGHT,
    physics: {
        default: 'arcade'
    },
    scene: [ TitleScene, LevelScene, InstructionsScene, PauseScene, HelpScene, YouWin, GameOver ]
};

var game = new Phaser.Game(config);
