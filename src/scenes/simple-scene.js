// ********* When you uncomment the imports below vvv there are some errors that I will be working on in the Enemy.js and Turret.js files *********
import Turret from '../sprites/Turret';
import Enemy from '../sprites/Enemy';

export class SimpleScene extends Phaser.Scene {
  preload() {
    // ********* "this" is the current scene, or "SimpleScene" *********
    this.load.image('tower', 'assets/2DTDassets/PNG/Default size/towerDefense_tile203.png');
    this.load.image('normalEnemy', 'assets/2DTDassets/PNG/Default size/towerDefense_tile245.png');  
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
    let path;
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

    //Create global array of enemies
    this.enemies = [];
    this.enemies_running = [];
    this.nextEnemy = 0;

    //create 10 new enemies and put them in enemies array.
    for (var i = 0; i < 10; i++) {
        let enemy = new Enemy({
          scene: this,
          x: 0,
          y: 0,
          key: 'normalEnemy',
          path: path
        })
        enemy.setVisible(false);
        enemy.setActive(false);
        this.enemies.push(enemy);
    }
    //Below is not functioning.
    // let enemies = this.add.group({ classType: Enemy, runChildUpdate: true });
    // this.nextEnemy = 0;

    //let turrets = this.add.group({ classType: Turret, runChildUpdate: true });
    //this.input.on('pointerdown', placeTurret);

    // bullets = this.add.group({ classType: Bullet, runChildUpdate: true });

  }

  update(time, delta) {
    // if its time for the next enemy
    if (time > this.nextEnemy)
    {        
        if(this.enemies[0]){ //if there are enemies left in the enemies array.
            this.enemies[0].setActive(true);
            this.enemies[0].setVisible(true);
            this.enemies[0].startOnPath();
            let enemy = this.enemies.shift(); //removes 0 position enemy from array and moves it into enemy variable
            this.enemies_running.push(enemy); //enemies currently running.
        }
        
        this.nextEnemy = time + 2000;
    }       
    
    //manually update all of the enemies 
    for (var i = 0; i < this.enemies_running.length; i++) {
        this.enemies_running[i].update(time, delta);
    }  
  }
}