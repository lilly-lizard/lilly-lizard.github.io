import { Application, Assets, Container, Graphics, Sprite } from '/lib/pixi_v8.10.2.min.mjs'

(async () => {

const app = new Application();
const background_color = 0x0e1339;
await app.init({ background: background_color, resizeTo: window });

// chuck the new canvas in the html document
document.body.appendChild(app.canvas);

const center_x = app.screen.width / 2;
const center_y = app.screen.height / 2;

draw_wire_rects();

function draw_wire_rects() {
	// draw rectangle https://pixijs.com/8.x/guides/migrations/v8#graphics-api-overhaul
	const wire_thickness = 30;
	const circuit_height = 300;
	const circuit_width = 600;
	const border_color = 0x505050;
	const border_thickness = 2;

	var rect_1 = new Graphics();
	rect_1.rect(center_x - circuit_width / 2, center_y - circuit_height / 2, circuit_width, circuit_height);
	rect_1.fill(0x000000);
	rect_1.stroke({ width: border_thickness, color: border_color });
	app.stage.addChild(rect_1);

	var rect_2 = new Graphics();
	rect_2.rect(center_x - circuit_width / 2 + wire_thickness, center_y - circuit_height / 2 + wire_thickness,
		circuit_width - wire_thickness * 2, circuit_height - wire_thickness * 2);
	rect_2.fill(background_color);
	rect_2.stroke({ width: border_thickness, color: border_color });
	app.stage.addChild(rect_2);
}

})();

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
