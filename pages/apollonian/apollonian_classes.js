
/* ------- CIRCLE CLASS ------- */


var circle = function(k, z) {
  this.k = k; // circle curvature = 1 / radius
  this.r = 1/abs(k); // radius
  this.z = z; // center of the circle represented by a complex number
  this.zs = z.scale(k); // scaled z variable used in Descartes' theorem
  this.tangent_circles = [];
}
var circle_functions = (function() {
  function isEqual(c) {
    var equalR = abs(this.r - c.r) < tolerance;
    var equalX = abs(this.z.x - c.z.x) < tolerance;
    var equalY = abs(this.z.y - c.z.y) < tolerance;
    return equalR && equalX && equalY;
  }
  function drawc() {
    // adjust the colors...
    var distance = col_center.sub(this.z).modulus();
    stroke(lerpColor(col_l, col_u, distance/dim_min));
    // draw the circle!
    ellipse(this.z.x, this.z.y, 2*this.r, 2*this.r);
  }
  function draw_old() {
    // adjust the colors...
    stroke(lerpColor(col_u, col_l, this.z.y/height));
    // draw the circle!
    ellipse(this.z.x, this.z.y, 2*this.r, 2*this.r);
  }
  return function() {
    this.isEqual = isEqual;
    this.drawc = drawc;
    return this;
  };
})();


/* ------- COMPLEX NUMBER CLASS ------- */


var complex = function(x, y) {
  this.x = x;
  this.y = y;
}
var complex_functions = (function() {
  function add(z) { return new complex(this.x + z.x, this.y + z.y); }
  function sub(z) { return new complex(this.x - z.x, this.y - z.y); }
  function mult(z) { return new complex(this.x * z.x - this.y * z.y, this.x * z.y + this.y * z.x); }
  function scale(s) { return new complex(this.x * s, this.y * s); }
  function sq() { return this.mult(this); }
  function modulus() { return sqrt(this.x * this.x + this.y * this.y); }
  function sqrtz() {
    var r = sqrt(sqrt(this.x * this.x + this.y * this.y));
    var arg = atan2(this.y,this.x)/2.0;
    return new complex(r*cos(arg), r*sin(arg));
  }
  return function() {
    this.add = add;
    this.sub = sub;
    this.mult = mult;
    this.scale = scale;
    this.sq = sq;
    this.modulus = modulus;
    this.sqrtz = sqrtz;
    return this;
  };
})();


/* ------- APPLY PROTOTYPES ------- */


complex_functions.call(complex.prototype);
circle_functions.call(circle.prototype);
