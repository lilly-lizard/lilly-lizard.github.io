var PAUSED;

const vertices = [
	-1., -1.,  0.,
	 3., -1.,  0.,
	-1.,  3.,  0., 
];
const indices = [0, 1, 2];

const vert_code = `#version 300 es
precision highp float;

in vec3 i_pos;
out vec2 a_uv;

void main(void) {
	a_uv = i_pos.xy;
	gl_Position = vec4(i_pos, 1.);
}
`;

function hex_to_rgb(hex) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16) / 255.,
		g: parseInt(result[2], 16) / 255.,
		b: parseInt(result[3], 16) / 255.
	} : null;
}

var background_color = hex_to_rgb("#ffb880");
var material_0_color = hex_to_rgb("#b5835a");
var material_1_color = hex_to_rgb("#986a44");
var material_2_color = hex_to_rgb("#865e3c");
var fract_depth = 1.5;

var last_timestamp = Date.now();
var current_time = 0;
var time_uniform_location;

var frag_code;
async function load_frag_code() {
	fetch('webgl.frag')
		.then(response => response.text())
		.then(data => {
			frag_code = data;
		})
		.catch(error => console.error('error fetching webgl.frag: ', error));
}

async function main() {
	let frag_code_response = await fetch('webgl.frag') // todo remove await?
		.catch(error => console.error('error fetching webgl.frag: ', error));

	let pause_checkbox = document.getElementById("paused_checkbox");
	function update_pause() { PAUSED = pause_checkbox.checked; }
	pause_checkbox.addEventListener("change", update_pause);
	update_pause();

	var canvas = document.getElementById('draw-canvas');
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	gl = canvas.getContext('webgl2');

	const vertex_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	const Index_Buffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Index_Buffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

	const vertShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertShader, vert_code);
	gl.compileShader(vertShader);

	let frag_code = await frag_code_response.text()
		.catch(error => console.error('error fetching webgl.frag: ', error));;
	const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragShader, frag_code); 
	gl.compileShader(fragShader);

	const shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertShader);
	gl.attachShader(shaderProgram, fragShader);
	gl.linkProgram(shaderProgram);
	gl.useProgram(shaderProgram);

	const vertex_input_location = gl.getAttribLocation(shaderProgram, "i_pos");
	time_uniform_location = gl.getUniformLocation(shaderProgram, "i_time");
	const depth_uniform_location = gl.getUniformLocation(shaderProgram, "i_fract_depth");
	const resolution_uniform_location = gl.getUniformLocation(shaderProgram, "i_resolution");
	const background_uniform_location = gl.getUniformLocation(shaderProgram, "i_background_color");
	const material_0_uniform_location = gl.getUniformLocation(shaderProgram, "i_material_0_color");
	const material_1_uniform_location = gl.getUniformLocation(shaderProgram, "i_material_1_color");
	const material_2_uniform_location = gl.getUniformLocation(shaderProgram, "i_material_2_color");

	const fract_depth_slider = document.getElementById('fract_depth');
	fract_depth = fract_depth_slider.value;
	fract_depth_slider.addEventListener('input', function() {
		fract_depth = fract_depth_slider.value;
		gl.uniform1f(depth_uniform_location, fract_depth);
	});

	const background_color_picker = document.getElementById('background_color');
	background_color = hex_to_rgb(background_color_picker.value);
	background_color_picker.addEventListener('input', function() {
		background_color = hex_to_rgb(background_color_picker.value);
		gl.uniform3f(background_uniform_location, background_color.r, background_color.g, background_color.b);
	});

	const material_0_color_picker = document.getElementById('material_0_color');
	material_0_color = hex_to_rgb(material_0_color_picker.value);
	material_0_color_picker.addEventListener('input', function() {
		material_0_color = hex_to_rgb(material_0_color_picker.value);
		gl.uniform3f(material_0_uniform_location, material_0_color.r, material_0_color.g, material_0_color.b);
	});

	const material_1_color_picker = document.getElementById('material_1_color');
	material_1_color = hex_to_rgb(material_1_color_picker.value);
	material_1_color_picker.addEventListener('input', function() {
		material_1_color = hex_to_rgb(material_1_color_picker.value);
		gl.uniform3f(material_1_uniform_location, material_1_color.r, material_1_color.g, material_1_color.b);
	});

	const material_2_color_picker = document.getElementById('material_2_color');
	material_2_color = hex_to_rgb(material_2_color_picker.value);
	material_2_color_picker.addEventListener('input', function() {
		material_2_color = hex_to_rgb(material_2_color_picker.value);
		gl.uniform3f(material_2_uniform_location, material_2_color.r, material_2_color.g, material_2_color.b);
	});

	gl.uniform1f(depth_uniform_location, fract_depth);
	gl.uniform2f(resolution_uniform_location, canvas.width, canvas.height);
	gl.uniform3f(background_uniform_location, background_color.r, background_color.g, background_color.b);
	gl.uniform3f(material_0_uniform_location, material_0_color.r, material_0_color.g, material_0_color.b);
	gl.uniform3f(material_1_uniform_location, material_1_color.r, material_1_color.g, material_1_color.b);
	gl.uniform3f(material_2_uniform_location, material_2_color.r, material_2_color.g, material_2_color.b);

	gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Index_Buffer);
	gl.vertexAttribPointer(vertex_input_location, 3, gl.FLOAT, false, 0, 0); 
	gl.enableVertexAttribArray(vertex_input_location);

	gl.disable(gl.DEPTH_TEST);
	gl.clearColor(background_color[0], background_color[1], background_color[2], 1.0);
	gl.viewport(0, 0, canvas.width, canvas.height);

	// loop

	render();
}

function render() {
	// if (PAUSED) {
	// 	last_timestamp = Date.now();
	// 	requestAnimationFrame(render);
	// 	return;
	// }

	if (!PAUSED) {
		const time_diff = Date.now() - last_timestamp;
		current_time += time_diff;
		let seconds_passed = current_time / 1000.;
		gl.uniform1f(time_uniform_location, seconds_passed);
	}
	
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

	// this function gets called again next time a frame is ready to be drawn
	last_timestamp = Date.now();
	requestAnimationFrame(render);
}

main();