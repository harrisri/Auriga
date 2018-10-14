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
    // Load background images and UI elements
    this.load.image('background', '/assets/background.png');

    // Load unit and tower sprites

    // Load unit and tower files
    this.load.json('infantry', '/data/units/infantry.json')
    this.load.json('heavy', '/data/units/heavy.json')
    this.load.json('flying', '/data/units/flying.json')
    this.load.json('speedy', '/data/units/speedy.json')
    this.load.json('arrow', '/data/tower/arrow.json')
    this.load.json('fire', '/data/tower/fire.json')
    this.load.json('ice', '/data/tower/ice.json')
    this.load.json('bomb', '/data/tower/bomb.json')
}


function create ()
{
    this.add.image(400, 300, 'background');
}

function update ()
{
}
