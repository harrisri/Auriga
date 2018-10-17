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

    // Load background images and UI elements
    this.load.image('background', '/assets/grassBackground.jpg');

    // Load unit and tower sprites
    this.load.atlas('sprites', 'assets/spritesheet.png', 'assets/spritesheet.json');
    this.load.image('bullet', 'assets/bullet.png');
    this.load.image('goblin', 'assets/goblin.png');
}

var Infantry = new Phaser.Class({

    Extends: Phaser.GameObjects.Image,

    initialize:
    function Infantry (scene)
    {
        let data = game.cache.json.get('infantry')
        // Replace with infantry image when complete
        Phaser.GameObjects.Image.call(this, scene, 0, 0, 'goblin', 'enemy');
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

var Heavy = new Phaser.Class({

    Extends: Phaser.GameObjects.Image,

    initialize:
    function Heavy (scene)
    {
        let data = game.cache.json.get('heavy')
        // Replace with heavy image when complete
        Phaser.GameObjects.Image.call(this, scene, 0, 0, 'goblin', 'enemy');
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


var Flying = new Phaser.Class({

    Extends: Phaser.GameObjects.Image,

    initialize:
    function Flying (scene)
    {
        let data = game.cache.json.get('flying')
        // Replace with heavy image when complete
        Phaser.GameObjects.Image.call(this, scene, 0, 0, 'goblin', 'enemy');
        this.follower = { t: 0, vec: new Phaser.Math.Vector2() };
        this.name = data['name']
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

var Speedy = new Phaser.Class({

    Extends: Phaser.GameObjects.Image,

    initialize:
    function Speedy (scene)
    {
        let data = game.cache.json.get('speedy')
        // Replace with heavy image when complete
        Phaser.GameObjects.Image.call(this, scene, 0, 0, 'goblin', 'enemy');
        this.follower = { t: 0, vec: new Phaser.Math.Vector2() };
        this.name = data['name']
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


var Arrow = new Phaser.Class({

    Extends: Phaser.GameObjects.Image,

    initialize:
    function Arrow (scene)
    {
        let data = game.cache.json.get('arrow');
        Phaser.GameObjects.Image.call(this, scene, 0, 0, 'sprites', 'turret');
        this.nextTic = 0;

        this.name = data['name'];
        this.level = 1;
        levelKey = 'level_' + this.level;
        this.cost = data['cost'][levelKey];
        this.damage = data['damage'][levelKey];
        this.range = data['range'][levelKey];
        this.rate = data['rate'][levelKey];
        this.ability = data['final_ability'];
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

var Bomb = new Phaser.Class({

    Extends: Phaser.GameObjects.Image,

    initialize:
    function Bomb (scene)
    {
        let data = game.cache.json.get('bomb');
        Phaser.GameObjects.Image.call(this, scene, 0, 0, 'sprites', 'turret');
        this.nextTic = 0;

        this.name = data['name'];
        this.level = 1;
        levelKey = 'level_' + this.level;
        this.cost = data['cost'][levelKey];
        this.damage = data['damage'][levelKey];
        this.range = data['range'][levelKey];
        this.rate = data['rate'][levelKey];
        this.radius = data['radius'][levelKey];
        this.ability = data['final_ability'];
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

var Fire = new Phaser.Class({

    Extends: Phaser.GameObjects.Image,

    initialize:
    function Fire (scene)
    {
        let data = game.cache.json.get('fire');
        Phaser.GameObjects.Image.call(this, scene, 0, 0, 'sprites', 'turret');
        this.nextTic = 0;

        this.name = data['name'];
        this.level = 1;
        levelKey = 'level_' + this.level;
        this.cost = data['cost'][levelKey];
        this.damage = data['damage'][levelKey];
        this.range = data['range'][levelKey];
        this.ability = data['final_ability'];
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

var Ice = new Phaser.Class({

    Extends: Phaser.GameObjects.Image,

    initialize:
    function Ice (scene)
    {
        let data = game.cache.json.get('ice');
        Phaser.GameObjects.Image.call(this, scene, 0, 0, 'sprites', 'turret');
        this.nextTic = 0;

        this.name = data['name'];
        this.level = 1;
        levelKey = 'level_' + this.level;
        this.cost = data['cost'][levelKey];
        this.damage = data['damage'][levelKey];
        this.range = data['range'][levelKey];
        this.slow = data['slow'][levelKey];
        this.duration = data['duration'][levelKey];
        this.ability = data['final_ability'];

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
        this.slow = data['slow'][levelKey];
        this.duration = data['duration'][levelKey];
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

function create() {
    this.add.image(400, 300, 'background');
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

    enemies = this.add.group({ classType: Infantry, runChildUpdate: true });
    this.nextEnemy = 0;
    turrets = this.add.group({ classType: Arrow, runChildUpdate: true });
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

            this.nextEnemy = time + 1000;
        }
    }
}

function render() {

    this.debug.text(`Debugging Phaser ${Phaser.VERSION}`, 20, 20, 'black', 'Segoe UI');

}
