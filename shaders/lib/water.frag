// sea
#define SEA_HEIGHT 0.3 //[0.0 0.01 0.03 0.05 0.07 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.85 0.9 0.95 1.0]
#define SEA_SPEED 2.8 //[0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0 1.1 1.2 1.3 1.4 1.5 1.7 2.0 2.5 3.0]
#define SEA_FREQ 0.08 //[0.01 0.02 0.03 0.04 0.05 0.06 0.07 0.08 0.09 0.1 0.11 0.12 0.13 0.14 0.15 0.16 0.17 0.18 0.19 0.2 0.21 0.22 0.23 0.24 0.25 0.26 0.27 0.28 0.29 0.3 0.31 0.32 0.33 0.34 0.35 0.36 0.37 0.38 0.39 0.4 0.41 0.42 0.43 0.44 0.45 0.46 0.47 0.48 0.49 0.5 0.51 0.52 0.53 0.54 0.55 0.56 0.57 0.58 0.59 0.6]
#define SEA_CHOPPY 7.5 //[0.5 1.0 1.5 2.0 2.5 3.0 3.5 4.0 4.5 5.0 5.5 6.0 6.5 7.0 7.5 8.0 8.5 9.0 9.5 10.0]

#define NATURAL_WAVE_GENERATOR

#ifdef NATURAL_WAVE_GENERATOR
const int ITER_GEOMETRY = 3;
const int ITER_GEOMETRY2 = 4;

float16_t sea_octave_micro(f16vec2 uv, float16_t choppy) {
	uv += noise(uv);
	f16vec2 wv = 1.0-abs(sin(uv));
	f16vec2 swv = abs(cos(uv));
	wv = mix(wv,swv,wv);
	return pow(1.0-pow(wv.x * wv.y,0.75),choppy);
}
#else
const int ITER_GEOMETRY = 3;
const int ITER_GEOMETRY2 = 3;

float16_t sea_octave_micro(f16vec2 uv, float16_t choppy) {
	uv += noise(uv);
	return (1.0 - sin(uv.x)) * cos(1.0 - uv.y) * 0.7;
}
#endif

const f16mat2 octave_m = f16mat2(1.4,1.1,-1.2,1.4);

const float16_t height_mul[4] = float[4] (
	0.32, 0.24, 0.21, 0.13
);
const float16_t total_height =
  height_mul[0] + 
  height_mul[0] * height_mul[1] +
  height_mul[0] * height_mul[1] * height_mul[2] +
  height_mul[0] * height_mul[1] * height_mul[2] * height_mul[3] + 1.0;
const float16_t rcp_total_height = 1.0 / total_height;

float16_t getwave(vec3 p, in float lod) {
	float16_t freq = SEA_FREQ;
	float16_t amp = SEA_HEIGHT;
	float16_t choppy = SEA_CHOPPY;
	float16_t speed0 = SEA_SPEED;
	f16vec2 uv = p.xz - vec2(frametime * 0.5, 0.0); uv.x *= 0.75;
	vec2 fuv = p.xz * 2.0 - p.y * 2.0 - frametime * vec2(0.1, 0.5); fuv.x *= 0.75;

	float16_t wave_speed = frametime * speed0;

	float16_t d, h = 0.0;
	for(int i = 0; i < ITER_GEOMETRY; i++) {
		d = sea_octave_micro((fuv+wave_speed * vec2(0.1, 0.9))*freq,choppy);
		h += d * amp * mix(lod, 1.0, float(i) * 0.25);
		fuv *= octave_m; freq *= 1.9; amp *= height_mul[i]; wave_speed *= 0.5;
		choppy = mix(choppy,1.0,0.2);
	}

	return (h * rcp_total_height - SEA_HEIGHT) * lod;
}

float16_t getwave2(vec3 p, in float16_t lod) {
	float16_t freq = SEA_FREQ;
	float16_t amp = SEA_HEIGHT;
	float16_t choppy = SEA_CHOPPY;
	float16_t speed0 = SEA_SPEED;
	vec2 fuv = p.xz * 2.0 - p.y * 2.0 - frametime * vec2(0.1, 0.5); fuv.x *= 0.75;
	f16vec2 uv = p.xz - vec2(frametime * 0.5, 0.0); uv.x *= 0.75;

	float16_t wave_speed = frametime * speed0;

	float d, h = 0.0;
	for(int i = 0; i < ITER_GEOMETRY2; i++) {
		d = sea_octave_micro((fuv+wave_speed * vec2(0.1, 0.9))*freq,choppy);
		h += d * amp * mix(lod, 1.0, float(i) * 0.25);
		fuv *= octave_m; freq *= 1.9; amp *= height_mul[i];
		wave_speed *= 0.5;
		choppy = mix(choppy,1.0,0.2);
	}

	return (h * rcp_total_height - SEA_HEIGHT);
}

vec3 get_water_normal(in vec3 wwpos, in float lod, in vec3 N, in vec3 T, in vec3 B) {
	vec3 w1 = 0.02 * T + getwave2(wwpos + 0.02 * T, lod) * N;
	vec3 w2 = 0.02 * B + getwave2(wwpos + 0.02 * B, lod) * N;
	vec3 w0 = getwave2(wwpos, lod) * N;
	#define tangent w1 - w0
	#define bitangent w2 - w0
	return normalize(cross(bitangent, tangent));
}

#ifdef WATER_PARALLAX
void WaterParallax(inout vec3 wpos, in float lod, vec3 tangentpos) {
	vec3 adjusted = wpos;

	float heightmap = getwave(wpos + cameraPosition, lod);

	vec3 offset = vec3(0.0f);
	vec3 s = normalize(tangentpos);
	s /= s.z;

	for (int i = 0; i < 8; i++) {
		float prev = offset.z;

		offset += (heightmap - prev) * 0.5 * s;

		heightmap = getwave(wpos + vec3(offset.x, 0.0, offset.y) + cameraPosition, lod);
		if (abs(offset.z - heightmap) < 0.05) break;
	}

	wpos += vec3(offset.x, offset.z, offset.y);
}
#endif

#ifdef WATER_CAUSTICS
float get_caustic (in vec3 wpos) {
	wpos += (64.0 - wpos.y) * (worldLightPosition / worldLightPosition.y);
	vec3 n = get_water_normal(wpos, 1.0, vec3(0.0, 1.0, 0.0), vec3(1.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0));
	return pow2(1.0 - abs(dot(n, worldLightPosition)));
}
#endif