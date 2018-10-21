export default class Turret extends Phaser.GameObjects.Sprite {
    constructor(config) {
        Phaser.GameObjects.Sprite.call(this, scene, 0, 0, 'tower', 'turret');
        this.nextTic = 0;
    }

    // we will place the turret according to the grid
    place(i, j) {
        this.y = i * 50 + 50/2;
        this.x = j * 50 + 50/2;
        map[i][j] = 1;
    }

    update(time, delta){
        // time to shoot
        if(time > this.nextTic) {                
            this.nextTic = time + 1000;
        }
    }
};