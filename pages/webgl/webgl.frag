#version 300 es
precision highp float;

// https://jbaker.graphics/writings/DEC.html

in vec2 a_uv;
out vec4 o_color;

uniform float i_time;
uniform float i_fract_depth;
uniform vec2 i_resolution;
uniform vec3 i_background_color;
uniform vec3 i_material_1_color;
uniform vec3 i_material_2_color;

const float MAX_DISTANCE = 30.0;
const int MAX_STEPS = 512;
const float FOG_FALLOFF = 0.05;

vec4 orb;

float map(in vec3 pos)
{
	float scale = 1.0;
	orb = vec4(1000.);

	for (int i = 0; i < 8; i++)
	{
		pos = mod(pos - 1., 2.) - 1.;

		float r2 = dot(pos, pos);
		orb = min(orb, vec4(abs(pos), r2));
		
		float k = i_fract_depth / r2;
		pos   *= k;
		scale *= k;
	}

	return 0.25 * length(pos.xz) / scale;
}

float map_iq(vec3 pos)
{
	float scale = 1.0;
	orb = vec4(1000.);
	
	for (int i = 0; i < 8; i++)
	{
		pos = 2.0 * fract(0.5 * pos + 0.5) - 1.0;

		float r2 = dot(pos, pos);
		orb = min(orb, vec4(abs(pos), r2));
		
		float k = i_fract_depth / r2;
		pos   *= k;
		scale *= k;
	}
	
	return 0.25 * abs(pos.y) / scale;
}

// returns hit distance along ray direction. -1 for miss.
float trace(in vec3 ray_origin, in vec3 ray_dir)
{
	float hit_dist = 0.01;
	for (int i = 0; i < MAX_STEPS; i++)
	{
		float precis = 0.001 * hit_dist; // precision decreases with depth
		
		float h = map(ray_origin + ray_dir * hit_dist);
		if (h < precis || MAX_DISTANCE < hit_dist ) break; // we're done
		hit_dist += h;
	}

	if (hit_dist > MAX_DISTANCE) hit_dist = -1.0; // ray miss
	return hit_dist;
}

vec3 calc_normal(in vec3 pos, in float hit_dist)
{
	float precis = 0.001 * hit_dist; // precision decreases with depth
	vec2 e = vec2(1.0, -1.0) * precis; // epsilom
	return normalize(e.xyy * map(pos + e.xyy) + 
					 e.yyx * map(pos + e.yyx) + 
					 e.yxy * map(pos + e.yxy) + 
					 e.xxx * map(pos + e.xxx));
}

vec3 render(in vec3 ray_origin, in vec3 ray_dir)
{
	float hit_dist = trace(ray_origin, ray_dir);

	if (hit_dist <= 0.) return i_background_color; // ray miss
	
	vec4 tra = orb;
	vec3 pos = ray_origin + hit_dist * ray_dir;
	vec3 normal = calc_normal(pos, hit_dist);

	// lighting
	vec3 headlight = ray_origin + vec3(0.1, 3.0, 0.3);
	vec3 light1 = vec3( 0.577, 0.577, -0.577);
	vec3 light2 = vec3(-0.707, 0.000,  0.707);

	float key = clamp(dot(light1, normal), 0.0, 1.0);
	float bac = clamp(0.2 + 0.8 * dot(light2, normal), 0.0, 1.0);
	float amb = (0.7 + 0.3 * normal.y);
	float ao = pow(clamp(tra.w * 2.0, 0.0, 1.0), 1.2);

	vec3 brdf = 1.0 * vec3(0.40, 0.40, 0.40) * amb * ao;
	brdf += 1.0 * vec3(1.00, 1.00, 1.00) * key * ao;
	brdf += 1.0 * vec3(0.40, 0.40, 0.40) * bac * ao;

	// material
	vec3 rgb = vec3(1.0);
	rgb = mix(rgb, i_material_1_color, clamp(6.0 * tra.y, 0.0, 1.0));
	rgb = mix(rgb, i_material_2_color, pow(clamp(1.0 - 2.0 * tra.z, 0.0, 1.0), 8.0));

	// color
	vec3 fog = exp(FOG_FALLOFF * (hit_dist - MAX_DISTANCE)) * i_background_color; // greater distance = more fog
	vec3 color = rgb * brdf * fog;
	return sqrt(color);
}

vec3 anim_ray_origin(in float time) {
	return vec3(
		2.8 * cos(0.33 * time + 0.1),
		0.3 * cos(0.37 * time) + 0.4,
		2.8 * cos(0.35 * time + 0.5)
	);
}

vec3 anim_ray_direction(in float time, in vec3 ray_origin, in vec2 uv) {
	vec3 ta = vec3(
		1.9 * cos(0.41 * time + 1.2),
		0.1 * cos(0.27 * time) + 0.4,
		1.9 * cos(0.38 * time + 2.0)
	);
	float roll = 0.2 * cos(0.1 * time);
	vec3 cw = normalize(ta - ray_origin);
	vec3 cp = vec3(sin(roll), cos(roll), 0.0);
	vec3 cu = normalize(cross(cw, cp));
	vec3 cv = normalize(cross(cu, cw));
	return normalize(uv.x * cu + uv.y * cv + 2.0 * cw);
}

void main(void)
{
	float time = i_time * 0.25;
	
	vec2 coord = gl_FragCoord.xy + vec2(0.5, 0.5);
	vec2 uv = (2.0 * coord-i_resolution.xy) / i_resolution.y;

	// camera
	vec3 ray_origin = anim_ray_origin(time);
	vec3 ray_dir = anim_ray_direction(time, ray_origin, uv);

	vec3 color = render(ray_origin, ray_dir);
	o_color = vec4(color, 1.0);	
}