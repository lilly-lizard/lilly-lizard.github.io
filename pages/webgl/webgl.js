// https://jbaker.graphics/writings/DEC.html

var PAUSED;

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
uniform vec2 i_resolution;

float fmod(float a, float b) {
	return a - (b * floor(a / b));
}

void main(void) {
	o_color = vec4(a_uv, fmod(i_time, 1.), 1.);
}
`;

const iqFragCode = `#version 300 es
precision highp float;

in vec2 a_uv;
out vec4 o_color;
uniform float i_time;
uniform vec2 i_resolution;

vec4 orb;

float map( vec3 p, float s )
{
	float scale = 1.0;

	orb = vec4(1000.0); 
	
	for( int i=0; i<8;i++ )
	{
		p = -1.0 + 2.0*fract(0.5*p+0.5);

		float r2 = dot(p,p);
		
		orb = min( orb, vec4(abs(p),r2) );
		
		float k = s/r2;
		p     *= k;
		scale *= k;
	}
	
	return 0.25*abs(p.y)/scale;
}

float trace( in vec3 ro, in vec3 rd, float s )
{
	float maxd = 30.0;
	float t = 0.01;
	for( int i=0; i<512; i++ )
	{
		float precis = 0.001 * t;
		
		float h = map( ro+rd*t, s );
		if( h<precis||t>maxd ) break;
		t += h;
	}

	if( t>maxd ) t=-1.0;
	return t;
}

vec3 calcNormal( in vec3 pos, in float t, in float s )
{
	float precis = 0.001 * t;

	vec2 e = vec2(1.0,-1.0)*precis;
	return normalize( e.xyy*map( pos + e.xyy, s ) + 
					  e.yyx*map( pos + e.yyx, s ) + 
					  e.yxy*map( pos + e.yxy, s ) + 
					  e.xxx*map( pos + e.xxx, s ) );
}

vec3 render( in vec3 ro, in vec3 rd, in float anim )
{
	// trace	
	vec3 col = vec3(0.0);
	float t = trace( ro, rd, anim );
	if( t>0.0 )
	{
		vec4 tra = orb;
		vec3 pos = ro + t*rd;
		vec3 nor = calcNormal( pos, t, anim );

		// lighting
		vec3  light1 = vec3(  0.577, 0.577, -0.577 );
		vec3  light2 = vec3( -0.707, 0.000,  0.707 );
		float key = clamp( dot( light1, nor ), 0.0, 1.0 );
		float bac = clamp( 0.2 + 0.8*dot( light2, nor ), 0.0, 1.0 );
		float amb = (0.7+0.3*nor.y);
		float ao = pow( clamp(tra.w*2.0,0.0,1.0), 1.2 );

		vec3 brdf  = 1.0*vec3(0.40,0.40,0.40)*amb*ao;
		brdf += 1.0*vec3(1.00,1.00,1.00)*key*ao;
		brdf += 1.0*vec3(0.40,0.40,0.40)*bac*ao;

		// material		
		vec3 rgb = vec3(1.0);
		rgb = mix( rgb, vec3(1.0,0.80,0.2), clamp(6.0*tra.y,0.0,1.0) );
		rgb = mix( rgb, vec3(1.0,0.55,0.0), pow(clamp(1.0-2.0*tra.z,0.0,1.0),8.0) );

		// color
		col = rgb*brdf*exp(-0.2*t);
	}

	return sqrt(col);
}

void main(void)
{
	float time = i_time * 0.25;
	float anim = 1.1 + 0.5 * smoothstep(-0.3, 0.3, cos(0.1 * i_time));
	
	vec3 tot = vec3(0.0);

	vec2 q = gl_FragCoord.xy + vec2(1., 1.);
	vec2 p = (2.0*q-i_resolution.xy)/i_resolution.y;

	// camera
	vec3 ro = vec3( 2.8*cos(0.1+.33*time), 0.4 + 0.30*cos(0.37*time), 2.8*cos(0.5+0.35*time) );
	vec3 ta = vec3( 1.9*cos(1.2+.41*time), 0.4 + 0.10*cos(0.27*time), 1.9*cos(2.0+0.38*time) );
	float roll = 0.2*cos(0.1*time);
	vec3 cw = normalize(ta-ro);
	vec3 cp = vec3(sin(roll), cos(roll),0.0);
	vec3 cu = normalize(cross(cw,cp));
	vec3 cv = normalize(cross(cu,cw));
	vec3 rd = normalize( p.x*cu + p.y*cv + 2.0*cw );

	tot += render( ro, rd, anim );
	
	o_color = vec4( tot, 1.0 );	

}
`;

let pause_checkbox = document.getElementById("paused_checkbox");
function update_pause() { PAUSED = pause_checkbox.checked; }
pause_checkbox.addEventListener("change", update_pause);
update_pause();

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
gl.shaderSource(fragShader, iqFragCode); 
gl.compileShader(fragShader);

const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertShader);
gl.attachShader(shaderProgram, fragShader);
gl.linkProgram(shaderProgram);
gl.useProgram(shaderProgram);

const vertex_input_location = gl.getAttribLocation(shaderProgram, "i_pos");
const time_uniform_location = gl.getUniformLocation(shaderProgram, "i_time");
const resolution_uniform_location = gl.getUniformLocation(shaderProgram, "i_resolution");

gl.uniform2f(resolution_uniform_location, canvas.width, canvas.height);

gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Index_Buffer);
gl.vertexAttribPointer(vertex_input_location, 3, gl.FLOAT, false, 0, 0); 
gl.enableVertexAttribArray(vertex_input_location);

gl.disable(gl.DEPTH_TEST);
gl.clearColor(0.5, 0.5, 0.5, 0.9);
gl.viewport(0, 0, canvas.width, canvas.height);

// loop

var last_timestamp = Date.now();
var current_time = 0;

render();

function render() {
	if (PAUSED) {
		last_timestamp = Date.now();
		requestAnimationFrame(render);
		return;
	}

	const time_diff = Date.now() - last_timestamp;
	current_time += time_diff;
	let seconds_passed = current_time / 1000.;
	gl.uniform1f(time_uniform_location, seconds_passed);
	
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

	// this function gets called again next time a frame is ready to be drawn
	last_timestamp = Date.now();
	requestAnimationFrame(render);
}
