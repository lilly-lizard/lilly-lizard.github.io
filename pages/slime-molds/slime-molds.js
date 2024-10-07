/*
Resources:
- youtube tutorial on p5js slime mold coding: https://www.youtube.com/watch?v=VyXxSNcgDtg
- slime mold blog post: https://cargocollective.com/sagejenson/physarum
- slime mold research paper (pattern inspo): https://uwe-repository.worktribe.com/output/980579/characteristics-of-pattern-formation-and-evolution-in-approximations-of-physarum-transport-

TODO:
- reset button
*/

function transform_identity(x) { return x; }
function transform_radians(x) {	return radians(x); }
function transform_decay_factor(x) { return 1 - 1 / (pow(2, x) + 1); } // asymptote at y = 1, intersects origin with gradient of 1. low value corresponds to fraction of 1. high values very close to 1 e.g. 0.9999

class SliderConfig {
	constructor(initial_value, var_name, transform = transform_identity) {
		this.value = initial_value; // note that this is redundent because it gets overridden by 'update_value_and_display' at the end of this function
		this.slider = document.getElementById(var_name + '_slider');
		this.display = document.getElementById(var_name + '_display');
		this.transform = transform;

		this.update_value_and_display = this.update_value_and_display.bind(this); // bind 'this' so that 'this' can be accessed inside a callback
		this.slider.addEventListener('input', this.update_value_and_display);

		this.update_value_and_display();
	}

	update_value_and_display() {
		this.display.textContent = this.slider.value;
		this.value = this.transform(this.slider.value);
	}
}

// CONFIG
var PAUSED;
var MOVEMENT_SPEED;
var TURN_RADIANS;
var SENSE_RANGE;
var SENSE_RADIANS;
var DECAY_FACTOR;
var TURN_CHANCE = 0.33;
var MOLD_COUNT = 200;
var DEPOSIT_VALUE = 1.0;
var SENSE_THRESHOLD = 0.2;
var SLIME_R = 50;
var SLIME_R = 255;
var SLIME_R = 128;
var BACKGROUND_COLOR = 5;
var BLUR_WEAKNESS = 8;

const GRID_X = 400;
const GRID_Y = 400;
const SCALE_FACTOR = 2;
var canvas_ctx;
var image_data;

var trail_map = []; // between 0. and 1.
var mold_map = [];

var g0;
var g1;
var g2;

// because the stupid ducking javascript modulo returns negative numbers 🤦
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
		let front_x = this.position_x + SENSE_RANGE.value * sin(this.angle);
		let front_y = this.position_y + SENSE_RANGE.value * cos(this.angle);

		let left_x = this.position_x + SENSE_RANGE.value * sin(this.angle - SENSE_RADIANS.value);
		let left_y = this.position_y + SENSE_RANGE.value * cos(this.angle - SENSE_RADIANS.value);

		let right_x = this.position_x + SENSE_RANGE.value * sin(this.angle + SENSE_RADIANS.value);
		let right_y = this.position_y + SENSE_RANGE.value * cos(this.angle + SENSE_RADIANS.value);

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
			// random direction
			let rand = random();
			if (rand < TURN_CHANCE.value) {
				this.turn_left();
			} else if (rand < TURN_CHANCE.value * 2) {
				this.turn_right();
			}
			// else straight ahead
		}
	}

	turn_left() {
		this.angle = (this.angle - TURN_RADIANS.value) % TAU; // clamp to preserve float accuracy after running for a long time
	}

	turn_right() {
		this.angle = (this.angle + TURN_RADIANS.value) % TAU; // clamp to preserve float accuracy after running for a long time
	}

	// moves 1 space in direction determined by `angle`
	move() {
		this.position_x += MOVEMENT_SPEED.value * sin(this.angle);
		this.position_y += MOVEMENT_SPEED.value * cos(this.angle);
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
	angleMode(RADIANS);
	noCanvas();
	
	let canvas = document.getElementById("draw-canvas");
	canvas_ctx = canvas.getContext("2d");
	canvas_ctx.imageSmoothingEnabled = false;
	image_data = canvas_ctx.createImageData(GRID_X, GRID_Y);

	init_config_listeners();

	init_simulation();
}

function init_simulation() {
	init_trail_map();
	init_mold_map();
	init_diffuse_factors();
}

function init_config_listeners() {
	MOVEMENT_SPEED = new SliderConfig(0.5, 'movement_speed');
	TURN_RADIANS = new SliderConfig(TAU / 12, 'turn_angle', transform_radians);
	SENSE_RANGE = new SliderConfig(4.3, 'sense_range');
	SENSE_RADIANS = new SliderConfig(TAU / 12, 'sense_angle', transform_radians);
	DECAY_FACTOR = new SliderConfig(TAU / 12, 'decay_factor', transform_decay_factor);
	TURN_CHANCE = new SliderConfig(0.33, 'turn_chance');

	let pause_checkbox = document.getElementById("paused_checkbox");
	function update_pause() { PAUSED = pause_checkbox.checked; }
	pause_checkbox.addEventListener("change", update_pause);
	update_pause();

	let reset_button = document.getElementById('reset-button');
	reset_button.addEventListener('click', init_simulation);
}

function init_trail_map() {
	for (let i = 0; i < GRID_X; i++) {
		trail_map[i] = [];
		for (let j = 0; j < GRID_Y; j++) {
			trail_map[i][j] = 0.;
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
	if (PAUSED) {
		return;
	}
	performance.mark("draw start");

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

	performance.mark("draw finished");
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
			let decayed = diffused * DECAY_FACTOR.value;
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

async function render_slime_trail() {
	performance.mark("render start");

	image_data = canvas_ctx.createImageData(GRID_X, GRID_Y);

	for (let i = 0; i < GRID_X; i++) {
		for (let j = 0; j < GRID_Y; j++) {
			let slime = trail_map[i][j];
			let image_idx = (i + j * GRID_X) * 4;
			// todo only need to write green?
			image_data.data[image_idx    ] = slime * 50;	// red
			image_data.data[image_idx + 1] = slime * 255; 	// green
			image_data.data[image_idx + 2] = slime * 128;	// blue
			image_data.data[image_idx + 3] = 255; 			// alpha
		}
	}

	let image_bitmap = await createImageBitmap(image_data);
	canvas_ctx.drawImage(image_bitmap, 0, 0, GRID_X * SCALE_FACTOR, GRID_Y * SCALE_FACTOR);
	//canvas_ctx.putImageData(image_data, 0, 0);

	performance.mark("render finish");
}