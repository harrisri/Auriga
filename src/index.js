import 'phaser';

import { SimpleScene } from './scenes/simple-scene';

const gameConfig = {
  type: Phaser.AUTO,
    parent: 'content',
    width: 800,
    height: 600,
    physics: {
        default: 'arcade'
  },
  scene: SimpleScene
};

new Phaser.Game(gameConfig);