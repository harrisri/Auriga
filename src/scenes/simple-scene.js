import Turret from '../sprites/Turret';
import Enemy from '../sprites/Enemy';

// needed to make path global so it could be accessed in the new Enemy object config update function. line 111
let path;

export class SimpleScene extends Phaser.Scene {
  preload() {
    this.load.image('tower', 'assets/2DTDassets/PNG/Default size/towerDefense_tile203.png');
    this.load.image('normalEnemy', 'assets/2DTDassets/PNG/Default size/towerDefense_tile245.png');
  }

  create() {
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

    // This function was the issue the whole time. I saw this post (http://www.html5gamedevs.com/topic/20346-solved-game-object-becoming-undefined-typescript-and-phaser/)
    // and looked into arrow functions. Because placeTurret is executed through a callback in line 103, according to some weird JS rule we need to use an arrow function.
    const placeTurret = (pointer) => {
      var i = Math.floor(pointer.y/50);
      var j = Math.floor(pointer.x/50);
      if(canPlaceTurret(i, j)) {
          // create new turret object
          let turretObject = new Turret ({
            scene: this,
            x: j,
            y: i,
            key: 'tower'
          })
          
          turretObject.setActive(true);
          turretObject.setVisible(true);
          // moved the place function logic out of the Enemy class because map was out of scope in the Enemy.js file
          turretObject.y = i * 50 + 50/2;
          turretObject.x = j * 50 + 50/2;
          map[i][j] = 1;
          // Referenced this boilerplate (https://github.com/nkholski/phaser3-es6-webpack/blob/master/src/scenes/GameScene.js) line 572.
          // Added the new Turret object into a group
          this.turrets.add(turretObject);
      }
    }

    function canPlaceTurret(i, j) {
      return map[i][j] === 0;
    }

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

    // Referenced this boilerplate (https://github.com/nkholski/phaser3-es6-webpack/blob/master/src/scenes/GameScene.js) line 75.
    // Create a new group without a ClassType (unlike how we did before) and add in the objects later
    this.enemies = this.add.group({runChildUpdate: true});
    this.nextEnemy = 0;

    this.turrets = this.add.group({runChildUpdate: true});
    this.input.on('pointerdown', placeTurret);

    // this.bullets = this.add.group({runChildUpdate: true});
  }

  update(time, delta) {  
    // if its time for the next enemy
    if (time > this.nextEnemy)
    {
      // create new enemy object
      let enemyObject = new Enemy({
        scene: this,
        x: 0,
        y: 0,
        key: 'normalEnemy',
        path: path
      })

      enemyObject.setActive(true);
      enemyObject.setVisible(true);
      // Referenced this boilerplate (https://github.com/nkholski/phaser3-es6-webpack/blob/master/src/scenes/GameScene.js) line 572.
      // Added the new Enemy object into a group
      this.enemies.add(enemyObject);
            
      // place the enemy at the start of the path
      enemyObject.startOnPath();
          
      this.nextEnemy = time + 1000;
    }       
  }
}