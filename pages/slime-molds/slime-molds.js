/*
Resources:
- youtube tutorial on p5js slime mold coding: https://www.youtube.com/watch?v=VyXxSNcgDtg
- slime mold blog post: https://cargocollective.com/sagejenson/physarum
- slime mold research paper (pattern inspo): https://uwe-repository.worktribe.com/output/980579/characteristics-of-pattern-formation-and-evolution-in-approximations-of-physarum-transport-

TODO:
*/

// CONFIG
var DECAY_FACTOR = 0.99;
var GRID_X = 400;
var GRID_Y = 400;
var MOLD_COUNT = 200;
var DEPOSIT_VALUE = 1.0;
var slider_movement_speed;
var display_movement_speed;
var MOVEMENT_SPEED = 0.5;
var SENSE_RANGE = 1.5;
var SENSE_ANGLE = 40;
var SENSE_THRESHOLD = 0.2;
var TURN_ANGLE = 3.1416 / 12;
var BACKGROUND_COLOR = 5;
var INITIAL_SLIME = 0.;
var SLIME_HUE = 150;
var SLIME_SAT = 60;
var BLUR_WEAKNESS = 8;

var trail_map = []; // between 0. and 1.
var mold_map = [];

var g0;
var g1;
var g2;

// because the stupid ducking javascript modulo returns negative numbers
function mod(n, m) {
	return ((n % m) + m) % m;
}

// position: [x, y] vector relative to top-left of canvas
// angle: direction the mold is facing in degrees clockwise relative to north
class Mold {
	constructor(position_x, position_y, angle) {
		this.position_x = position_x;
		this.position_y = position_y;
		this.angle = angle;
	}

	// updates direction `angle` based on state of `trail_map`
	sense_and_turn() {
		let front_x = this.position_x + SENSE_RANGE * sin(this.angle);
		let front_y = this.position_y + SENSE_RANGE * cos(this.angle);

		let left_x = this.position_x + SENSE_RANGE * sin(this.angle - SENSE_ANGLE);
		let left_y = this.position_y + SENSE_RANGE * cos(this.angle - SENSE_ANGLE);

		let right_x = this.position_x + SENSE_RANGE * sin(this.angle + SENSE_ANGLE);
		let right_y = this.position_y + SENSE_RANGE * cos(this.angle + SENSE_ANGLE);

		let front_trail_value = read_trail_value(front_x, front_y);
		let left_trail_value  = read_trail_value(left_x , left_y );
		let right_trail_value = read_trail_value(right_x, right_y);

		if (front_trail_value - left_trail_value > SENSE_THRESHOLD &&
				front_trail_value - right_trail_value > SENSE_THRESHOLD) {
			// largest value in front -> don't change direction
			return;

		} else if (left_trail_value - front_trail_value > SENSE_THRESHOLD &&
				left_trail_value - right_trail_value > SENSE_THRESHOLD) {
			// largest value on left
			this.turn_left();

		} else if (right_trail_value - front_trail_value > SENSE_THRESHOLD &&
				right_trail_value - left_trail_value > SENSE_THRESHOLD) {
			// largest value on right
			this.turn_right();

		} else {
			// keep moving straight
		}
	}

	turn_left() {
		this.angle = mod(this.angle - TURN_ANGLE, TAU); // clamp to preserve float accuracy after running for a long time
	}

	turn_right() {
		this.angle = mod(this.angle + TURN_ANGLE, TAU); // clamp to preserve float accuracy after running for a long time
	}

	// moves 1 space in direction determined by `angle`
	move() {
		this.position_x += MOVEMENT_SPEED * sin(this.angle);
		this.position_y += MOVEMENT_SPEED * cos(this.angle);
		this.position_x = mod(this.position_x, GRID_X);
		this.position_y = mod(this.position_y, GRID_Y);
	}

	// adds `DEPOSIT_VALUE` to `trail_map` at this mold's `position`
	deposit() {
		add_trail_value(this.position_x, this.position_y, DEPOSIT_VALUE);
	}
}

/* ------- INIT ------- */

function setup() {
	colorMode(HSB);
	angleMode(RADIANS);
	
	createCanvas(GRID_X, GRID_Y);
	background(BACKGROUND_COLOR);

	init_config_listeners();
	init_trail_map();
	init_mold_map();
	init_diffuse_factors();
}

function init_config_listeners() {
	slider_movement_speed = document.getElementById('MOVEMENT_SPEED');
	display_movement_speed = document.getElementById('display_movement_speed');

	function update_display_movement_speed() { display_movement_speed.textContent = slider_movement_speed.value; }
	slider_movement_speed.addEventListener('input', update_display_movement_speed);
}

function init_trail_map() {
	for (let i = 0; i < GRID_X; i++) {
		trail_map[i] = [];
		for (let j = 0; j < GRID_Y; j++) {
			trail_map[i][j] = INITIAL_SLIME;
		}
	}
}

function init_mold_map() {
	for (let m = 0; m < MOLD_COUNT; m++) {
		let position_x = random(GRID_X);
		let position_y = random(GRID_Y);
		let angle = random(TAU);
		mold_map[m] = new Mold(position_x, position_y, angle);
	}
}

function init_diffuse_factors() {
	g0 = pow(4., BLUR_WEAKNESS);
	g1 = pow(2., BLUR_WEAKNESS);
	g2 = pow(1., BLUR_WEAKNESS);

	let div = g0 + g1 * 4. + g2 * 4.;
	g0 /= div;
	g1 /= div;
	g2 /= div;
}

/* ------- LOOP ------- */

function draw() {
	sync_html();

	// slime mold algorithm
	for (let m = 0; m < MOLD_COUNT; m++) {
		mold_map[m].sense_and_turn();
		mold_map[m].move();
	}

	for (let m = 0; m < MOLD_COUNT; m++) {
		mold_map[m].deposit();
	}

	dissipate_trail_map();

	// render
	render_slime_trail();
}

function sync_html() {
	MOVEMENT_SPEED = slider_movement_speed.value;
}

function read_trail_value(x, y) {
	let clamped_x = mod(x, GRID_X);
	let clamped_y = mod(y, GRID_Y);

	// `x` and `y` are floats which lie between multiple squares on the `trail_map` grid
	// this means we will read from 4 different squares and weight them based on how close
	// we are to each
	let ratio_x_inv = clamped_x % 1.0;
	let ratio_y_inv = clamped_y % 1.0;
	let ratio_x = 1.0 - ratio_x_inv;
	let ratio_y = 1.0 - ratio_y_inv;

	// indices to read from `trail_map`
	let index_x   = floor(clamped_x);
	let index_y   = floor(clamped_y)
	let index_x_p = floor((clamped_x + 1) % GRID_X); // x + 1
	let index_y_p = floor((clamped_y + 1) % GRID_Y); // y + 1
	
	// read
	let trail_value = 0.;
	trail_value += trail_map[index_x  ][index_y  ] * ratio_x * ratio_y;
	trail_value += trail_map[index_x  ][index_y_p] * ratio_x * ratio_y_inv;
	trail_value += trail_map[index_x_p][index_y  ] * ratio_x_inv * ratio_y;
	trail_value += trail_map[index_x_p][index_y_p] * ratio_x_inv * ratio_y_inv;
	return trail_value; // will be between 0. and 1. (assuming all values in `trail_map` are too)
}

function add_trail_value(x, y, add_value) {
	let clamped_x = mod(x, GRID_X);
	let clamped_y = mod(y, GRID_Y);

	// `x` and `y` are floats which lie between multiple squares on the `trail_map` grid
	// this means we will read from 4 different squares and weight them based on how close
	// we are to each
	let ratio_x_inv = clamped_x % 1.0;
	let ratio_y_inv = clamped_y % 1.0;
	let ratio_x = 1.0 - ratio_x_inv;
	let ratio_y = 1.0 - ratio_y_inv;

	// indices to read from `trail_map`
	let index_x   = floor(clamped_x);
	let index_y   = floor(clamped_y)
	let index_x_p = floor((clamped_x + 1) % GRID_X); // x + 1
	let index_y_p = floor((clamped_y + 1) % GRID_Y); // y + 1
	
	// add and clamp
	trail_map[index_x  ][index_y  ] = min(trail_map[index_x  ][index_y  ] + add_value * ratio_x * ratio_y        , 1.);
	trail_map[index_x  ][index_y_p] = min(trail_map[index_x  ][index_y_p] + add_value * ratio_x * ratio_y_inv    , 1.);
	trail_map[index_x_p][index_y  ] = min(trail_map[index_x_p][index_y  ] + add_value * ratio_x_inv * ratio_y    , 1.);
	trail_map[index_x_p][index_y_p] = min(trail_map[index_x_p][index_y_p] + add_value * ratio_x_inv * ratio_y_inv, 1.);
}

// diffuse and decay each trail map value
function dissipate_trail_map() {
	let new_trail_map = [];
	for (let i = 0; i < GRID_X; i++) {
		new_trail_map[i] = [];
		for (let j = 0; j < GRID_Y; j++) {
			let diffused = diffused_trail_value(i, j);
			let decayed = diffused * DECAY_FACTOR;
			new_trail_map[i][j] = min(decayed, 1.0);
		}
	}
	trail_map = new_trail_map;
}

// 3x3 mean filter (wrap around indices)
function diffused_trail_value(x, y) {
	let i_x = floor(x);
	let i_y = floor(y);
	let i_x_m = floor(mod(x - 1, GRID_X)); // x - 1
	let i_y_m = floor(mod(y - 1, GRID_Y)); // y - 1
	let i_x_p = floor((x + 1) % GRID_X); // x + 1
	let i_y_p = floor((y + 1) % GRID_Y); // y + 1
	
	let summed_trail = trail_map[i_x_m][i_y_m] * g2 + trail_map[i_x][i_y_m] * g1 + trail_map[i_x_p][i_y_m] * g2 +
					   trail_map[i_x_m][i_y  ] * g1 + trail_map[i_x][i_y  ] * g0 + trail_map[i_x_p][i_y  ] * g1 +
					   trail_map[i_x_m][i_y_p] * g2 + trail_map[i_x][i_y_p] * g1 + trail_map[i_x_p][i_y_p] * g2;
	return summed_trail;
}

function render_slime_trail() {
	background(BACKGROUND_COLOR);

	for (let i = 0; i < GRID_X; i++) {
		for (let j = 0; j < GRID_Y; j++) {
			let slime = trail_map[i][j];
			set(i, j, color(SLIME_HUE, SLIME_SAT, slime * 100));
			//set(i, j, slime_color);//todo
		}
	}

	updatePixels();
}