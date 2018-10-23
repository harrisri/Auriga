// ********* When you uncomment the imports below vvv there are some errors that I will be working on in the Enemy.js and Turret.js files *********
import Turret from '../sprites/Turret';
import Enemy from '../sprites/Enemy';

export class SimpleScene extends Phaser.Scene {
  preload() {
    // ********* "this" is the current scene, or "SimpleScene" *********
    this.load.atlas('sprites', 'assets/spritesheet.png', 'assets/spritesheet.json');
    this.load.image('tower', 'assets/2DTDassets/PNG/Default size/towerDefense_tile203.png');
    this.load.image('normalEnemy', 'assets/2DTDassets/PNG/Default size/towerDefense_tile245.png');
    
    // ********* test code to load images *********
    this.load.image('cokecan', 'assets/cokecan.png');
  }

  create() {
    function drawGrid(graphics) {
      graphics.lineStyle(1, 0x006400, 0.5);
      for (let i = 0; i < 16; i++) {
          graphics.moveTo((i*100)/2, 0);
          graphics.lineTo((i*100)/2, 600);
      }

      for (let i = 0; i < 12;  i++) {
          graphics.moveTo(0, (i*100)/2);      
          graphics.lineTo(800, (i*100)/2);     
      }
      graphics.strokePath();
    }

    function placeTurret(pointer) {
      let i = Math.floor(pointer.y/50);
      let j = Math.floor(pointer.x/50);
      if(canPlaceTurret(i, j)) {
          let turret = turrets.get();
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

    // ********* test code to render images *********
    this.add.text(100, 100, 'Hello Phaser!', { fill: '#0f0' });
    this.add.image(100, 200, 'cokecan');

    this.add.image (400, 300, 'tower');
    this.add.image(500, 400, 'normalEnemy');

    // ********* For some reason our path, and grid are not getting drawn on the current scene. I will work on that a bit more tonight. *********
    let path;
    const ENEMY_SPEED = 1/50000;

    const map =    [[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
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
    let graphics = this.add.graphics();
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

    // let enemies = this.add.group({ classType: Enemy, runChildUpdate: true });
    // this.nextEnemy = 0;

    let turrets = this.add.group({ classType: Turret, runChildUpdate: true });
    this.input.on('pointerdown', placeTurret);

    // bullets = this.add.group({ classType: Bullet, runChildUpdate: true });

  }

  update(time, delta) {
    // if its time for the next enemy
    if (time > this.nextEnemy)
    {        
        let enemy = enemies.get();
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
}