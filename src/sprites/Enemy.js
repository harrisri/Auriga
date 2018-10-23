export default class Enemy extends Phaser.GameObjects.Sprite {
    constructor(config) {
        super(config.scene, config.x, config.y, config.key);
        //Phaser.GameObjects.Sprite.call(SimpleScene, 0, 0, 'normalEnemy', 'enemy');

        //no idea why these two lines are needed, but the game breaks without them.
        config.scene.physics.world.enable(this);
        config.scene.add.existing(this);
        
        //path the enemies follow.
        this.path = config.path;

        //speed, hp, and armor can likely be loaded in from json data.  Speed is set here manually for now
        this.speed = 1/60000;

        //for moving down the path
        this.follower = { t: 0, vec: new Phaser.Math.Vector2() };
    }

    startOnPath() {
        // set the t parameter at the start of the path
        this.follower.t = 0;
        
        // get x and y of the given t point            
        this.path.getPoint(this.follower.t, this.follower.vec);
        
        // set the x and y of our enemy to the received from the previous step
        this.setPosition(this.follower.vec.x, this.follower.vec.y);
    }

    update(time, delta) {
        // move the t point along the path, 0 is the start and 0 is the end
        this.follower.t += this.speed * delta;
            
        // get the new x and y coordinates in vec
        this.path.getPoint(this.follower.t, this.follower.vec);
        
        // update enemy x and y to the newly obtained x and y
        this.setPosition(this.follower.vec.x, this.follower.vec.y);

        // if we have reached the end of the path, remove the enemy
        if (this.follower.t >= 1)
        {
            this.setActive(false);
            this.setVisible(false);
        }
    }
};