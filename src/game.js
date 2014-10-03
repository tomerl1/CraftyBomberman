var Game = {

	map_grid: {
		width:  23,
		height: 15,
		scale: 2,
		tile: {
			width:  16,
			height: 16
		},
		grid: []
	},

	width: function() {
		return this.map_grid.width * this.map_grid.tile.width;
	},

	height: function() {
		return this.map_grid.height * this.map_grid.tile.height;
	},

	start: function() {
		Crafty.init(Game.width(), Game.height());
		Crafty.canvas.init();

		var sw = Game.width() * this.map_grid.scale,
		sh = Game.height() * this.map_grid.scale,
		stage = Crafty.stage.elem,
		canvas = Crafty.stage.elem.getElementsByTagName('canvas')[0];

		canvas.style.width = sw + 'px';
		canvas.style.height = sh + 'px';
		stage.style.width = sw + 'px';
		stage.style.height = sh + 'px';
		Crafty.scene('Loading');
		Crafty.background('#000');
	},

	initGrid: function() {
		Game.map_grid.grid = new Array(Game.map_grid.width);
		for (var i = 0; i < Game.map_grid.width; i++) {
			Game.map_grid.grid[i] = new Array(Game.map_grid.height);
			for (var y = 0; y < Game.map_grid.height; y++) {
				Game.map_grid.grid[i][y] = '';
			}
		}

		for (var x = 0; x < Game.map_grid.width; x++) {
			for (var y = 0; y < Game.map_grid.height; y++) {
				var at_edge = x == 0 || x == Game.map_grid.width - 1 || y == 0 || y == Game.map_grid.height - 1;
				if (at_edge || x % 2 == 0 && y % 2 == 0) {
					Crafty.e('SolidBlockTile').at(x, y);
					Game.map_grid.grid[x][y] = 'SolidBlockTile';
				} 
				else {
					var isCorner = (x == 1 && (y == 1 || y == 2) || x == 2 && y == 1) || 
					(x == Game.map_grid.width - 2 && (y == 1 || y == 2) || x == Game.map_grid.width - 3 && y == 1) ||
					(x == 1 && (y == Game.map_grid.height - 2 || y == Game.map_grid.height - 3) || x == 2 && y == Game.map_grid.height - 2) || 
					(x == Game.map_grid.width - 2 && (y == Game.map_grid.height - 2 || y == Game.map_grid.height - 3) || x == Game.map_grid.width - 3 && y == Game.map_grid.height - 2);
					if (!isCorner && Math.random() > 0.35) { 
						Crafty.e('SoftBlockTile').at(x, y);
						Game.map_grid.grid[x][y] = 'SoftBlockTile';
					}
					else if (Game.map_grid.grid[x][y - 1] == 'SoftBlockTile' || Game.map_grid.grid[x][y - 1] == 'SolidBlockTile') {
						Crafty.e('ShadowedGrassTile').at(x, y);
						Game.map_grid.grid[x][y] = 'ShadowedGrassTile';
					}
					else {
						Crafty.e('GrassTile').at(x, y);
						Game.map_grid.grid[x][y] = 'GrassTile';
					}
				}
			}
		}
	}
}