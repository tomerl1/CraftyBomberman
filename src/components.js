Crafty.c('Grid', {
  init: function() {
    this.attr({
      w: Game.map_grid.tile.width,
      h: Game.map_grid.tile.height
    })
  },

  at: function(x, y) {
    if (x === undefined && y === undefined) {
      return { x: this.x / Game.map_grid.tile.width, y: this.y / Game.map_grid.tile.height };
    } else {
      if (this.h > Game.map_grid.tile.height) { 
        this.attr({ x: x * Game.map_grid.tile.width, y: (y * Game.map_grid.tile.height) - (this.h - Game.map_grid.tile.height) });
      }
      else {
        this.attr({ x: x * Game.map_grid.tile.width, y: y * Game.map_grid.tile.height });
      }
      return this;
    }
  },

  getGridPosition: function() {
    var i, j;

    i = Math.round(this.x / Game.map_grid.tile.width);
    if (this.h > Game.map_grid.tile.height) { 
      j = Math.round((this.y + this.h - Game.map_grid.tile.height) / Game.map_grid.tile.height);
    }
    else {
      j = Math.round(this.y / Game.map_grid.tile.height);
    }

    return { i: i, j: j};
  }
});

Crafty.c('BaseMapTile', {
  init: function() {
    this.requires('2D, Canvas, Grid, Collision');
  },
});

Crafty.c('SoftMapTiles', {
  init: function() {
    this.requires('BaseMapTile');
  },
});

Crafty.c('SolidMapTiles', {
  init: function() {
    this.requires('BaseMapTile, Solid');
  },
});

Crafty.c('SolidBlockTile', {
  init: function() {
    this.requires('SolidMapTiles, sprite_SolidBlock');
  },
});

Crafty.c('SoftBlockTile', {
  init: function() {
    this.requires('SolidMapTiles, sprite_SoftBlock');
  },
});

Crafty.c('GrassTile', {
  init: function() {
    this.requires('SoftMapTiles, sprite_Grass');

    this.bind('EnterFrame', function() {
      var p = this.getGridPosition();
      if (Game.map_grid.grid[p.i][p.j - 1] == 'SoftBlockTile' || Game.map_grid.grid[p.i][p.j - 1] == 'SolidBlockTile') {
        this.destroy();
        Crafty.e('ShadowedGrassTile').at(p.i, p.j);
      }
    });
  },
});

Crafty.c('ShadowedGrassTile', {
  init: function() {
    this.requires('SoftMapTiles, sprite_ShadowedGrass');

    this.bind('EnterFrame', function() {
      var p = this.getGridPosition();
      if (!(Game.map_grid.grid[p.i][p.j - 1] == 'SoftBlockTile' || Game.map_grid.grid[p.i][p.j - 1] == 'SolidBlockTile')) {
        this.destroy();
        Crafty.e('GrassTile').at(p.i, p.j);
      }
    });
  },
});

Crafty.c('Bomberman', {
  bombs: null, 
  isOverlappingBomb: null,
  bombSize: null,
  isLocked: null,
  isDead: null,
  maxBombs: null,

  init: function() {
    this.requires('SolidMapTiles, SpriteAnimation, Fourway, Keyboard')
    .fourway(0.8)
    .stopOnSolids()
    .setCollision();

    this.bombs = [];
    this.isOverlappingBomb = false;
    this.bombSize = 2;
    this.isLocked = false;
    this.isDead = false;
    this.maxBombs = 1;
    this.bind('NewDirection', function(data) {
      if (!this.isLocked) {
        if (data.x > 0) {
          this.animate('WalkRight', -1);
        } else if (data.x < 0) {
          this.animate('WalkLeft', -1);
        } else if (data.y > 0) {
          this.animate('WalkDown', -1);
        } else if (data.y < 0) {
          this.animate('WalkUp', -1);
        } else {
          this.pauseAnimation();
        }
      }
    });

    this.bind('KeyDown', function(e) {
      if (e.key == Crafty.keys.SPACE) {
        if (this.bombs.length < this.maxBombs) {
          var x = Math.floor((this.x + 5) / Game.map_grid.tile.width);
          var y = Math.floor((this.y + 26 - 5) / Game.map_grid.tile.height);
          var p;
          for (var i = 0; i < this.bombs.length; i++) {
            p = this.bombs[i].getGridPosition();
            if (p.i == x && p.j == y){
              return;
            }
          };

          var bomb = Crafty.e('BombTile').at(x, y).setBombSize(this.bombSize);
          this.bombs.push(bomb);
          var self = this;
          bomb.one('BombExploded', function() {
            self.bombs.shift();
          })
          this.isOverlappingBomb = true;
        }
      }
    });

    this.bind('Moved', function(from) {
      if (this.isLocked) {
        this.x = from.x;
        this.y = from.y;
        this._speed = 0;
        return;
      }

      if (this.isOverlappingBomb) {
        var hitdata = this.hit('Solid');
        this.isOverlappingBomb = false;
        for (var i = 0; i < hitdata.length; i++) {
          if (hitdata[i].obj === this.bombs[this.bombs.length - 1]) {
            this.isOverlappingBomb = true;
            break;
          }
        }
      }
    });
  },

  setCollision: function() {
    hitbox = new Crafty.polygon(
      [1, 11], 
      [16, 11], 
      [16, 25], 
      [1, 25]);
    this.collision(hitbox);
  },

  stopOnSolids: function() {
    this.onHit('Solid', function(hitdata) { this.stopMovement(hitdata); });
    return this;
  },

  stopMovement: function(hitdata) {
    if (this._movement && (this._movement.x != 0 || this._movement.y != 0)) {
      if (this.isOverlappingBomb && hitdata.length == 1) {
        return;
      }
      else {
        var allowXSlide = allowYSlide = true;
        /* init slide test*/
        this.x -= this._movement.x;
        this.y -= this._movement.y;

        if (this._movement.x != 0) {
          this.x += this._movement.x;
          if (this.hit('Solid')) {
            allowXSlide = false
            this.x -= this._movement.x;
          }
        }

        if (this._movement.x != 0) {
          this.y += this._movement.y;
          if (this.hit('Solid')) {
            allowYSlide = false;
            this.y -= this._movement.y;
          }
        }

        if (!(allowXSlide && allowYSlide)) {
          this._speed = 0;
        }
      }
    }
    else {
      this._speed = 0;
    }
  },

  die: function() {
    if (!this.isDead) {
      this.isDead = true;
      this.animate('Die', 1);
    }
  }
});

Crafty.c('WhitePlayer', {
  init: function() {
    this.requires('Bomberman, sprite_White')
    .reel('WalkDown', 700, [[0,0], [1,0], [2,0], [1,0]])
    .reel('WalkLeft', 700, [[3,0], [4,0], [5,0], [4,0]])
    .reel('WalkRight', 700, [[6,0], [7,0], [8,0], [7,0]])
    .reel('WalkUp', 700, [[9,0], [10,0], [11,0], [10,0]])
    .reel('Die',  1400, [[12,0], [13,0], [14,0], [15,0], [12,0], [13,0], [14,0], [15,0], [12,0], [13,0], [14,0], [15,0], [16,0], [17,0], [18,0], [19,0]]);
    this.reel('WalkDown').currentFrame = 1;
  }
});

Crafty.c('BlackPlayer', {
  init: function() {
    this.requires('Bomberman, sprite_Black')
    .reel('WalkDown', 700, [[0,1], [1,1], [2,1], [1,1]])
    .reel('WalkLeft', 700, [[3,1], [4,1], [5,1], [4,1]])
    .reel('WalkRight', 700, [[6,1], [7,1], [8,1], [7,1]])
    .reel('WalkUp', 700, [[9,1], [10,1], [11,1], [10,1]])
    .reel('Die',  1400, [[12,1], [13,1], [14,1], [15,1], [12,1], [13,1], [14,1], [15,1], [12,1], [13,1], [14,1], [15,1], [16,1], [17,1], [18,1], [19,1]]);
    this.reel('WalkDown').currentFrame = 1;
  },
});

Crafty.c('BluePlayer', {
  init: function() {
    this.requires('Bomberman, sprite_Blue')
    .reel('WalkDown', 700, [[0,2], [1,2], [2,2], [1,2]])
    .reel('WalkLeft', 700, [[3,2], [4,2], [5,2], [4,2]])
    .reel('WalkRight', 700, [[6,2], [7,2], [8,2], [7,2]])
    .reel('WalkUp', 700, [[9,2], [10,2], [11,2], [10,2]])
    .reel('Die',  1400, [[12,2], [13,2], [14,2], [15,2], [12,2], [13,2], [14,2], [15,2], [12,2], [13,2], [14,2], [15,2], [16,2], [17,2], [18,2], [19,2]]);
    this.reel('WalkDown').currentFrame = 1;
  },
});

Crafty.c('RedPlayer', {
  init: function() {
    this.requires('Bomberman, sprite_Red')
    .reel('WalkDown', 700, [[0,3], [1,3], [2,3], [1,3]])
    .reel('WalkLeft', 700, [[3,3], [4,3], [5,3], [4,3]])
    .reel('WalkRight', 700, [[6,3], [7,3], [8,3], [7,3]])
    .reel('WalkUp', 700, [[9,3], [10,3], [11,3], [10,3]])
    .reel('Die',  1400, [[12,3], [13,3], [14,3], [15,3], [12,3], [13,3], [14,3], [15,3], [12,3], [13,3], [14,3], [15,3], [16,3], [17,3], [18,3], [19,3]]);
    this.reel('WalkDown').currentFrame = 1;
  },
});

Crafty.c('BombTile', {
  size: null,

  init: function() {
    this.requires('SolidBlockTile, SpriteAnimation, sprite_Bomb')
    .reel('BombTick', 1000, [[0,0], [1,0], [2, 0], [1,0]])
    .setCollision();

    this.bind('AnimationEnd', function() {
      this.setExplosion();
    });

    this.animate('BombTick', 4);
  },

  setCollision: function() {
    hitbox = new Crafty.polygon(
      [0, 0], 
      [16, 0], 
      [16, 16], 
      [0, 16]);
    this.collision(hitbox);
  },

  setBombSize: function(size) {
    this.size = size;
    return this;
  },

  setExplosion: function() {
    var pos = this.getGridPosition(),
    top = left = right = bottom = 0, toRemove = [];

    while (top < this.size - 1) {
      if (Game.map_grid.grid[pos.i][pos.j - (top + 1)] == 'SolidBlockTile') {
        break;
      }

      if (Game.map_grid.grid[pos.i][pos.j - (top + 1)] == 'SoftBlockTile') {
        top++;
        break;
      }

      top++;
    }

    while (left < this.size - 1) {
      if (Game.map_grid.grid[pos.i - (left + 1)][pos.j] == 'SolidBlockTile') {
        break;
      }

      if (Game.map_grid.grid[pos.i - (left + 1)][pos.j] == 'SoftBlockTile') {
        left++;
        break;
      }

      left++;
    }

    while (right < this.size - 1) {
      if (Game.map_grid.grid[pos.i + (right + 1)][pos.j] == 'SolidBlockTile') {
        break;
      }

      if (Game.map_grid.grid[pos.i + (right + 1)][pos.j] == 'SoftBlockTile') {
        right++;
        break;
      }

      right++;
    }

    while (bottom < this.size - 1) {
      if (Game.map_grid.grid[pos.i][pos.j + (bottom + 1)] == 'SolidBlockTile') {
        break;
      }

      if (Game.map_grid.grid[pos.i][pos.j + (bottom + 1)] == 'SoftBlockTile') {
        bottom++;
        break;
      }

      bottom++;
    }

    for (var i = 1; i < left; i++) {
      Crafty.e('ExplosionHLeft').at(pos.i - i, pos.j);
    }

    for (var i = 1; i < right; i++) {
      Crafty.e('ExplosionHLeft').at(pos.i + i, pos.j).flip();
    }

    for (var i = 1; i < top; i++) {
      Crafty.e('ExplosionVTop').at(pos.i, pos.j - i);
    }

    for (var i = 1; i < bottom; i++) {
      Crafty.e('ExplosionVTop').at(pos.i, pos.j + i).flip('Y');
    }

    Crafty.e('ExplosionLeft').at(pos.i - left, pos.j);
    Crafty.e('ExplosionLeft').at(pos.i + right, pos.j).flip();
    Crafty.e('ExplosionTop').at(pos.i, pos.j - top);
    Crafty.e('ExplosionTop').at(pos.i, pos.j + bottom).flip('Y');
    Crafty.e('ExplosionCenter').at(pos.i, pos.j)
    this.trigger('BombExploded');
    this.destroy();
  }
});

Crafty.c('Explosion', {
  stuffToKill: null,

  init: function() {
    this.requires('SoftMapTiles, SpriteAnimation');

    this.animationSpeed = 1.5;
    this.stuffToKill = [];

    this.bind("EnterFrame", function() {
      this.killStuff();
    });

    this.bind('AnimationEnd', function(reel) {
      var p;
      for (var i = 0; i < this.stuffToKill.length; i++) {
        p = this.stuffToKill[i].getGridPosition();
        Crafty.e('GrassTile').at(p.i, p.j)
        Game.map_grid.grid[p.i][p.j] = 'GrassTile';

        if (this.stuffToKill[i].has('Bomberman') || this.stuffToKill[i].has('BombTile')) {
          //this.stuffToKill[i].die();
        }
        else {
          this.stuffToKill[i].destroy(); 
        }
      }

      this.destroy();
    });
  },

  killStuff: function() {
    var hitdata = this.hit('Solid');
    if (hitdata) {
      var obj;
      for (var i = 0; i < hitdata.length; i++) {
        obj = hitdata[i].obj;
        this.stuffToKill.push(obj);
        if (obj.has('Bomberman') && !obj.isLocked) {
          obj.isLocked = true;
          obj.die();
        }
        else if (obj.has('BombTile')) {
          obj.setExplosion();
        }
      }
    }
  }
});

Crafty.c('ExplosionCenter', {
  init: function() {
    this.requires('Explosion, sprite_Explosion_Center')
    .reel('Explode', 1000, [[0,0], [1,0], [2,0], [3,0], [4,0], [3,0], [2,0], [1,0], [0,0]]);
    this.animate('Explode', 1);
  }
});

Crafty.c('ExplosionHLeft', {
  init: function() {
    this.requires('Explosion, sprite_Explosion_H_Left')
    .reel('Explode', 1000, [[0,1], [1,1], [2,1], [3,1], [4,1], [3,1], [2,1], [1,1], [0,1]]);
    this.animate('Explode', 1);
  }
});

Crafty.c('ExplosionLeft', {
  init: function() {
    this.requires('Explosion, sprite_Explosion_Left')
    .reel('Explode', 1000, [[0,2], [1,2], [2,2], [3,2], [4,2], [3,2], [2,2], [1,2], [0,2]]);
    this.animate('Explode', 1);
  }
});

Crafty.c('ExplosionVTop', {
  init: function() {
    this.requires('Explosion, sprite_Explosion_V_Top')
    .reel('Explode', 1200, [[0,3], [1,3], [2,3], [3,3], [4,3], [3,3], [2,3], [1,3], [0,3]]);
    this.animate('Explode', 1);
  }
});

Crafty.c('ExplosionTop', {
  init: function() {
    this.requires('Explosion, sprite_Explosion_V_Top')
    .reel('Explode', 1000, [[0,4], [1,4], [2,4], [3,4], [4,4], [3,4], [2,4], [1,4], [0,4]]);
    this.animate('Explode', 1);
  }
});
