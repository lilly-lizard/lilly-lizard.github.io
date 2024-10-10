
const vertices = [
	-1., -1.,  0.,
	 3., -1.,  0.,
	-1.,  3.,  0., 
];
const indices = [0, 1, 2];

const vertCode = `#version 300 es
precision highp float;

in vec3 i_pos;
out vec2 a_uv;

void main(void) {
	a_uv = i_pos.xy;
	gl_Position = vec4(i_pos, 1.);
}
`;

const fragCode = `#version 300 es
precision highp float;

in vec2 a_uv;
out vec4 o_color;

uniform float i_time;

float fmod(float a, float b) {
	return a - (b * floor(a / b));
}

void main(void) {
	o_color = vec4(a_uv, fmod(i_time, 1.), 1.);
}
`;

var canvas = document.getElementById('draw-canvas');
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
gl.shaderSource(vertShader, vertCode);
gl.compileShader(vertShader);

const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragShader, fragCode); 
gl.compileShader(fragShader);

const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertShader);
gl.attachShader(shaderProgram, fragShader);
gl.linkProgram(shaderProgram);
gl.useProgram(shaderProgram);

const vertex_input_location = gl.getAttribLocation(shaderProgram, "i_pos");
const time_uniform_location = gl.getUniformLocation(shaderProgram, "i_time");

gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Index_Buffer);
gl.vertexAttribPointer(vertex_input_location, 3, gl.FLOAT, false, 0, 0); 
gl.enableVertexAttribArray(vertex_input_location);

gl.disable(gl.DEPTH_TEST);
gl.clearColor(0.5, 0.5, 0.5, 0.9);
gl.viewport(0, 0, canvas.width, canvas.height);

// loop

const startTime = Date.now();

render();

function render() {
	const second_passed = getSecondsPassed();
	
	gl.uniform1f(time_uniform_location, second_passed);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

	// this function gets called again next time a frame is ready to be drawn
	requestAnimationFrame(render);
}

function getSecondsPassed() {
	const current_time = Date.now();
	const elapsed_time = (current_time - startTime) / 1000.;
	return elapsed_time;
}