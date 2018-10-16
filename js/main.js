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

    //build the map basics.
    var graphics = this.add.graphics();
    createGrid(graphics);
    var path = this.add.path(0,75);
    path = createPath(graphics, path);

}

function update ()
{
}

function createPath(graphics,path){
    //Create the path that enemy units will travel on
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


    //change alpha value (third param) to 0 in order to hide path.
    graphics.lineStyle(3,0x000000,0.5);
    path.draw(graphics);
}

function createGrid(graphics){
    graphics.lineStyle(1,0xffffff,0.5)
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
