// a lot of code taken from this sketch, helped me to learn javascript!
// https://www.openprocessing.org/sketch/389913
// note that his code only works for his hard-coded case, don't forget the hard circles!

// shout out to this guy for explaining the full algorithm!
// http://code.activestate.com/recipes/578029-generalized-apollonian-gasket-fractal

// also uploaded to: https://openprocessing.org/sketch/626662


/* ------- CONSTANTS AND VARIABLES ------- */


const min_radius = 0.5; // the smallest radius we will allow
const min_nesting_radius = 2; // the smallest radius we will allow
const tolerance = 1.0; // for circle's being equal

var col_u; // the color for circles near the top of the screen [0,55,255] [100,255,119]
var col_l; // the color for circles near the bottom of the screen [255,0,0] [126,255,247]
var col_center; // center point of radiating colors

var circles; // a list of all the circles
var next_outer_z; // the outer circle for the next gasket
var next_outer_k; // must be pre-scaling integer k

var scale_f; // determined in setup to enlarge circles to screen size
var dim_min; // the smaller dimension of wither width or height
var intNow = (new Date()).getTime();


/* ------- INITIALIZING ------- */


function setup() {

	createCanvas(windowWidth,windowHeight);
	smooth(8);
	col_center = new complex(windowWidth/2,windowHeight);

	// prevent mobile scrolling (which interferes with interaction)
	var fixed = document.getElementById('defaultCanvas0');
	fixed.addEventListener('touchmove', function(e) { e.preventDefault(); }, false);
	//https://css-tricks.com/forums/topic/prevent-body-scrolling-when-the-user-scrolls-on-fixed-position-div/

	// choose 3 inital k values (largest to smallest radius) DO NOT CHANGE THESE
	var k1 = 3; // 3
	var k2 = 6; // 6
	var k3 = 7; // 7

	// determine 3 center points to comply with the k values
	// distances between centers
	var a = 1/k1 + 1/k3;
	var b = 1/k1 + 1/k2;
	var c = 1/k2 + 1/k3;
	var z2 = new complex(0, 0); // 2nd largest at origin
	var z1 = new complex(0, b); // largest directly below it
	// use law of cosines to find the third center
	var theta = acos((a*a - b*b - c*c)/(-2*b*c));
	// smallest circle connects to the right
	var z3 = new complex(c*sin(theta), c*cos(theta));

	// make 3 circles with kn and zn
	var c1 = new circle(k1, z1);
	var c2 = new circle(k2, z2);
	var c3 = new circle(k3, z3);
	// create our external and internal circles c4 and c5
	var inner_outer = descartes(c1,c2,c3);
	var c4 = inner_outer[0];
	var c5 = inner_outer[1];
	// initialize our circles array with our three inital circles
	circles = [c5,c1,c2,c3,c4];
	// set our next outer circle k for the nesting functionality
	next_outer_k = k1;

	// scale such that the outer circle is 0.8*size
	dim_min = width < height ? width : height;
	scale_f = dim_min*0.9/c5.r/2;
	// translate such that the outer circle is in the center
	var center = new complex(width/2 - c5.z.x*scale_f, height/2 - c5.z.y*scale_f);
	// translate to the center of the screen and enlarge
	circles.map(c => trans(c, center));
	// set our next outer circle z
	next_outer_z = z1;
	period = circles[0].r;

	//frameRate(120);
	noFill();
	col_u = color(30,55,255);
	col_l = color(255,0,20);

	// draw the circles!
	drawBackground();
	circles.map(c => c.drawc());
}

function trans(c, translate) {
	// enlarge a circle by scale factor and translate
	c.k /= scale_f; c.r *= scale_f;
	c.z.x *= scale_f; c.z.y *= scale_f;
	c.z.x += translate.x; c.z.y += translate.y;
	c.zs = c.z.scale(c.k); // reset zs when z changes
}


/* ------- LOOP ------- */


// set to true when all the circles have been evaluated
var ring_complete = false;
var all_complete = false;

function draw() {
	if (!ring_complete) {
		// construct the circles
		construct_circles();

	} else if(!all_complete) {
		// add another nested ring
		init_ring();

	} else {
		// draw the circles!
		drawBackground();
		circles.map(c => c.drawc());
} }

function construct_circles() {
	// add sub circles
	var incompleteCircles = circles.filter((c) => 0<c.tangent_circles.length && c.tangent_circles.length<5);
	var completion = incompleteCircles.reduce( function(acc,obj) { return concat(acc,apollonian(obj)); },[]);
	circles = circles.concat(completion);

	if (completion.length == 0)
		ring_complete = true;
	// draw new circles!
	completion.map(c => c.drawc());
}

// draws a background with a nice gradient!
function drawBackground() {
	background(0);
	var background_start = color(28, 1, 8);
	var background_end = color(2, 0, 28);

	for(var i = 0; i < height; i++){
		strokeWeight(1);
		var iN = map(i, 0, height, 0, 1);
		var c = lerpColor(background_start, background_end, iN);
		stroke(c);
		line(0, i, width, i);
} }

// called by init_ring when rings are finished
function renderDone() {
	ring_complete = true;
	all_complete = true;
	console.log((new Date()).getTime() - intNow);
}

function mouseDragged() {
	updateCenter();
	return false;
}
function mousePressed() {
	updateCenter();
}
function updateCenter() {
	col_center.x = constrain(mouseX, width/2-dim_min/2, width/2+dim_min/2-1);
	col_center.y = constrain(mouseY, height/2-dim_min/2, height/2+dim_min/2-1);
}


/* ------- NESTING GASKETS ------- */


function init_ring() {
	// create new outer circle using values from previous itteration
	var c_outer = new circle(-next_outer_k/scale_f, next_outer_z);

	// determine 3 other k values (largest to smallest radius)
	var k1 = next_outer_k + 1;  // n + 1
	var k2 = next_outer_k * k1; // n(n + 1)
	var k3 = k2 + 1;     // n(n + 1) + 1
	// set our next outer circle k for the nesting functionality
	next_outer_k = k1;
	// scale up
	k1 /= scale_f;
	k2 /= scale_f;
	k3 /= scale_f;

	// stop nesting once c2 gets too small
	if (1/k2 < min_nesting_radius) {
		renderDone();
		return;
	}

	// determine 3 center points to comply with the k values
	// distances between centers
	var a = 1/k1 + 1/k3;
	var b = 1/k1 + 1/k2;
	var c = 1/k2 + 1/k3;
	// fit c1 and c2 inside c4
	var z1 = new complex(c_outer.z.x, c_outer.z.y + c_outer.r - 1/k1); // below
	var z2 = new complex(c_outer.z.x, c_outer.z.y - c_outer.r + 1/k2); // above
	// use law of cosines to find the third center
	var theta = acos((c*c - b*b - a*a)/(-2*a*b));
	// smallest circle connects to the right
	var z3 = new complex(z1.x + a*sin(theta), z1.y - a*cos(theta));

	// make 3 circles with kn and zn
	var c1 = new circle(k1, z1);
	var c2 = new circle(k2, z2);
	var c3 = new circle(k3, z3);
	// create our internal circle c5
	var inner_outer = descartes(c1,c2,c3);
	var c4 = inner_outer[0];
	var c5 = inner_outer[1];
	// add our new circles to the array
	var new_circles = [c5,c1,c2,c3,c4];
	circles = circles.concat(new_circles);

	// set our next outer circle z
	next_outer_z = z1;
	// draw new circles!
	new_circles.map(c => c.drawc());
	// this new ring has got to be processed
	ring_complete = false;
}


/* ------- APOLLONIAN GASKET ALGORITHM ------- */


function apollonian(c) {
	// itterate the apollonian gasket algorithm to make a pretty fractal!
	// https://en.wikipedia.org/wiki/Apollonian_gasket

	c1 = c.tangent_circles[0];
	c2 = c.tangent_circles[1];
	c3 = c.tangent_circles[2];

	//Each call to decartes returns a pair of circles.
	//One we already have, so we filter it out. We'll also filter out circles that are too small.
	var c23 = descartes(c,c2,c3).filter((x)=> !c1.isEqual(x) && x.r > min_radius);
	var c13 = descartes(c,c1,c3).filter((x)=> !c2.isEqual(x) && x.r > min_radius);
	var c12 = descartes(c,c1,c2).filter((x)=> !c3.isEqual(x) && x.r > min_radius);

	return concat(c23,concat(c12,c13));
}
