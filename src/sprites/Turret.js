export default class Turret extends Phaser.GameObjects.Sprite {
    constructor(config) {
        super(config.scene, config.x, config.y, config.key);

        config.scene.physics.world.enable(this);
        config.scene.add.existing(this);
        
        this.nextTic = 0;
    }

    create() {
        Phaser.GameObjects.Sprite.call(config.scene, 0, 0, 'tower', 'turret');
    }

    update(time, delta){
        // time to shoot
        if(time > this.nextTic) {                
            this.nextTic = time + 1000;
        }
    }
};