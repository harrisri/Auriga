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
	this.load.image('background', '/assets/background.png');
}


function create ()
{
    this.add.image(400, 300, 'background');

    //Create the path that enemy units will travel on
    var graphics = this.add.graphics();
    var path = this.add.path(100,0);
    path.lineTo(100,100);
    path.lineTo(700,100);
    path.lineTo(700,300);
    path.lineTo(100,300);
    path.lineTo(100,500);
    path.lineTo(700,500);
    path.lineTo(700,600);

    graphics.lineStyle(3,0xffffff,1);
    path.draw(graphics);  
}

function update ()
{
}

function createPath(){
 
}