Crafty.scene('Game', function() {
  Game.initGrid();
  //Crafty.e('RedPlayer').at(1, 1).attr({ z: 100 });
  Crafty.e('BlackPlayer').at(Game.map_grid.width - 2, Game.map_grid.height - 2).attr({ z: 100 });
}, function() {});

Crafty.scene('Loading', function(){
  Crafty.e('2D, DOM, Text')
  .text('Loading...')
  .attr({ x: 0, y: Game.height()/2 - 24, w: Game.width() });

  Crafty.load(['assets/map_tiles_1.png', 
    'assets/bombs_tiles_1.png',
    'assets/bombermen_1.png',
    'assets/explosions_tiles_1.png',
    ], function(){

      Crafty.sprite(16, 'assets/map_tiles_1.png', { 
        sprite_SolidBlock: [0, 0],
        sprite_SoftBlock: [1, 0],
        sprite_ShadowedGrass: [2, 0],
        sprite_Grass: [3, 0],
      });

      Crafty.sprite(16, 17, 'assets/bombs_tiles_1.png', { 
        sprite_Bomb: [0, 0]
      });

      Crafty.sprite(16, 26, 'assets/bombermen_1.png', { 
        sprite_White: [0, 0],
        sprite_Black: [1, 0],
        sprite_Blue: [2, 0],
        sprite_Red: [3, 0]
      }, 5, 5, false);

      Crafty.sprite(16, 16, 'assets/explosions_tiles_1.png', { 
        sprite_Explosion_Center: [0, 0],
        sprite_Explosion_H_Left: [1, 0],
        sprite_Explosion_Left: [2, 0],
        sprite_Explosion_V_Top: [3, 0],
        sprite_Explosion_Top: [4, 0],
      }, 1, 1, true);

    // Now that our sprites are ready to draw, start the game
    Crafty.scene('Game');
  })
});