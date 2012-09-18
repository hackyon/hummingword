/**
 * Grid - subdivides the canvas into grids and uses it to detect word intersections
 */
var Grid = function(width, height) {
  var columns = width  / Grid.SIZE;
  var rows    = height / Grid.SIZE;

  var grid = [];
  for (var c = 0; c < columns; c++) {
    if (!grid[c]) grid[c] = [];
    for (var r = 0; r < rows; r++) {
      grid[c][r] = false;
    }
  }

  this.grid    = grid;
  this.columns = columns;
  this.rows    = rows;
};

Grid.SIZE = 10;

Grid.prototype.intersect = function(cast, x, y) {
  var column = Math.round(x / Grid.SIZE);
  var row    = Math.round(y / Grid.SIZE);

  for (var c = 0; c < cast.length; c++) {
    for (var r = 0; r < cast[c].length; r++) {
      // Ignore the intersection check if out of bounds
      if ((column + c) >= this.columns || 
          (row + r)    >= this.rows    ||
          (column + c) < 0 || (row + r) < 0) continue;

      if (cast[c][r] && this.grid[column + c][row + r]) {
        return true;
      }
    }
  }
  return false;
};

Grid.prototype.imprint = function(cast, x, y) {
  var column = Math.round(x / Grid.SIZE);
  var row    = Math.round(y / Grid.SIZE);

  for (var c = 0; c < cast.length; c++) {
    for (var r = 0; r < cast[c].length; r++) {
      if ((column + c) >= this.columns || 
          (row + r)    >= this.rows    ||
          (column + c) < 0 || (row + r) < 0) continue;

      this.grid[column + c][row + r] |= cast[c][r];
    }
  }
};

Grid.snap = function(n) {
  return Math.round(n / Grid.SIZE) * Grid.SIZE;
};

Grid.snapUp = function(n) {
  return Math.ceil(n / Grid.SIZE) * Grid.SIZE;
}


var grid   = null;
var width  = 0;
var height = 0;
var Config = null;

self.addEventListener('message', function(e) {
  var data = e.data;
  switch (data.command) {
    case 'init': 
      grid   = new Grid(data.width, data.height);
      width  = data.width;
      height = data.height;
      Config = data.config;
      break;

    case 'word':
      offset = data.offset;
      var start = {
        x : Grid.snap(width/2  + Math.round(Math.random() * 2 * Config.START_RANDOM_X - Config.START_RANDOM_X) + Config.START_SHIFT_X - offset.x),
        y : Grid.snap(height/2 + Math.round(Math.random() * 2 * Config.START_RANDOM_Y - Config.START_RANDOM_Y) + Config.START_SHIFT_Y - offset.y)
      };

      var x = start.x;
      var y = start.y;

      var radius = 0;
      var angle  = 0;

      // Find an empty spot using Archimedean Spiral
      while (grid.intersect(data.cast, x, y)) {

        // Because x and y may not change after "snapping" to the grid, the
        // inner loop keeps running until we arrive at a different x and y.
        do {
          radius += Math.random() * Config.RADIUS_RANDOM_FACTOR;
          angle  += Math.PI / (Math.random() * Config.ANGLE_RANDOM_FACTOR + Config.ANGLE_BASE);

          var next = {
            x : Grid.snap(Math.round(start.x + radius * Math.cos(angle))),
            y : Grid.snap(Math.round(start.y + radius * Math.sin(angle)))
          };
        } while (next.x == x && next.y == y);

        x = next.x;
        y = next.y;
      }
      grid.imprint(data.cast, x, y);
      self.postMessage({ command: "word", x: x, y: y });
      break;

    default: 
      break;
  }
});

