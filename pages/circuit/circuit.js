import { Application, Assets, Color, Container, Graphics, Sprite } from '/lib/pixi_v8.10.2.min.mjs'

class Vector {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
}

class Hsl {
	constructor(h, s, l) {
		this.h = h;
		this.s = s;
		this.l = l;
	}

	color() {
		return new Color({h: this.h, s: this.s, l: this.l});
	}
}

const background_color = new Hsl(233, 61, 14);

const electron_color_min = new Hsl(232, 61, 64);
const electron_color_max = new Hsl(339, 89, 62);

const circuit_border_color = 0x505050;
const circuit_border_thickness = 2;

(async () => {

const app = new Application();
await app.init({ background: background_color.color(), resizeTo: window });

// chuck the new canvas in the html document
document.body.appendChild(app.canvas);

var center_x = app.screen.width / 2;
var center_y = app.screen.height / 2;

draw_wire_rects();
draw_electron();

function draw_wire_rects() {
	// draw rectangle https://pixijs.com/8.x/guides/migrations/v8#graphics-api-overhaul
	const wire_thickness = 30;
	const circuit_height = 300;
	const circuit_width = 600;

	var rect_1 = new Graphics();
	rect_1.rect(center_x - circuit_width / 2, center_y - circuit_height / 2, circuit_width, circuit_height);
	rect_1.fill(0x000000);
	rect_1.stroke({ width: circuit_border_thickness, color: circuit_border_color });
	app.stage.addChild(rect_1);

	var rect_2 = new Graphics();
	rect_2.rect(center_x - circuit_width / 2 + wire_thickness, center_y - circuit_height / 2 + wire_thickness,
		circuit_width - wire_thickness * 2, circuit_height - wire_thickness * 2);
	rect_2.fill(background_color.color());
	rect_2.stroke({ width: circuit_border_thickness, color: circuit_border_color });
	app.stage.addChild(rect_2);
}

function draw_electron() {
	const pos = new Vector(center_x, center_y);
	const radius = 10;
	const energy = 0.5; // between 0.0 and 1.0

	var circle = new Graphics();
	circle.circle(pos.x, pos.y, radius);
	circle.fill(electron_color(energy));
	app.stage.addChild(circle);
}

})();

// HELPER FUNCTIONS

function electron_color(energy) {
	return mix_color(electron_color_min, electron_color_max, energy);
}

function mix_color(color_min, color_max, interpolate) {
	return new Hsl(
		mix(color_min.h, color_max.h, interpolate),
		mix(color_min.s, color_max.s, interpolate),
		mix(color_min.l, color_max.l, interpolate),
	);
}

function mix(x, y, a) {
	return x * (1 - a) + y * a;
}

// ARCHIVE

function draw_separate_wire_rectangles() {
	// draw rectangle https://pixijs.com/8.x/guides/migrations/v8#graphics-api-overhaul
	// var wire_thickness = 40;
	// var circuit_height = 300;
	// var circuit_width = 600;
	
	// var rect_1 = new Graphics(); // top
	// rect_1.rect(center_x - circuit_width / 2, center_y - circuit_height / 2, circuit_width, wire_thickness);
	// rect_1.fill(0x000000);
	// app.stage.addChild(rect_1);

	// var rect_2 = new Graphics(); // bottom
	// rect_2.rect(center_x - circuit_width / 2, center_y + circuit_height / 2, circuit_width + wire_thickness, wire_thickness);
	// rect_2.fill(0x000000);
	// app.stage.addChild(rect_2);

	// var rect_3 = new Graphics(); // left
	// rect_3.rect(center_x - circuit_width / 2, center_y - circuit_height / 2, wire_thickness, circuit_height);
	// rect_3.fill(0x000000);
	// app.stage.addChild(rect_3);

	// var rect_4 = new Graphics(); // right
	// rect_4.rect(center_x + circuit_width / 2, center_y - circuit_height / 2, wire_thickness, circuit_height + wire_thickness);
	// rect_4.fill(0x000000);
	// app.stage.addChild(rect_4);
}
