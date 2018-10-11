var config = {
    type: Phaser.AUTO,
    parent: 'content',
    physics: {
        default: 'arcade'
    },
    width: 800,
    height: 600,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

function preload ()
{
	this.load.image('background', '/assets/grassBackground.jpg');
}


function create ()
{
    this.add.image(400, 300, 'background');

    var graphics = this.add.graphics();
    createGrid(graphics);
    var path = this.add.path(0,50);
    path = createPath(graphics, path);

}

function update ()
{
}

function createPath(graphics,path){
    //Create the path that enemy units will travel on
    path.lineTo(150,50);
    path.lineTo(150,150);
    path.lineTo(650,150);
    path.lineTo(650,350);
    path.lineTo(50,350);
    path.lineTo(50,550);
    path.lineTo(800,550);

    //change alpha value (third param) to 0 in order to hide path.
    graphics.lineStyle(3,0x000000,0.8);
    path.draw(graphics);
}

function createGrid(graphics){
    graphics.lineStyle(1,0xffffff,0.5)
    for (var i = 0; i < 9; i++) {
          graphics.moveTo(i*100, 0);
          graphics.lineTo(i*100, 600);
    }

    for (var i = 0; i < 6;  i++) {
        graphics.moveTo(0, i*100);      
        graphics.lineTo(800, i*100);     
    }

    graphics.strokePath();
}
