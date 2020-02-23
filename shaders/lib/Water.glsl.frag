// sea
#define SEA_HEIGHT 0.45 //[0.0 0.01 0.03 0.05 0.07 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.85 0.9 0.95 1.0]
#define SEA_SPEED 0.8 //[0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0 1.1 1.2 1.3 1.4 1.5 1.7 2.0 2.5 3.0]
#define SEA_FREQ 0.05 //[0.01 0.02 0.03 0.04 0.05 0.06 0.07 0.08 0.09 0.1 0.11 0.12 0.13 0.14 0.15 0.16 0.17 0.18 0.19 0.2 0.21 0.22 0.23 0.24 0.25 0.26 0.27 0.28 0.29 0.3 0.31 0.32 0.33 0.34 0.35 0.36 0.37 0.38 0.39 0.4 0.41 0.42 0.43 0.44 0.45 0.46 0.47 0.48 0.49 0.5 0.51 0.52 0.53 0.54 0.55 0.56 0.57 0.58 0.59 0.6]
#define SEA_CHOPPY 4.5 //[0.5 1.0 1.5 2.0 2.5 3.0 3.5 4.0 4.5 5.0 5.5 6.0 6.5 7.0 7.5 8.0 8.5 9.0 9.5 10.0]

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
		fuv *= octave_m; freq *= 1.9; amp *= height_mul[i]; wave_speed *= 0.5;
		choppy = mix(choppy,1.0,0.2);
	}


	return (h * rcp_total_height - SEA_HEIGHT);
}

f16vec3 get_water_normal(in f16vec3 wwpos, in float16_t displacement, in float16_t lod, in f16vec3 dir) {
	f16vec3 w1 = vec3(0.01, dir.y * getwave2(wwpos + vec3(0.01, 0.0, 0.0), lod), 0.0);
	f16vec3 w2 = vec3(0.0, dir.y * getwave2(wwpos + vec3(0.0, 0.0, 0.01), lod), 0.01);
	f16vec3 w0 = displacement * dir;
	#define tangent w1 - w0
	#define bitangent w2 - w0
	return normalize(cross(bitangent, tangent));
}

#ifdef WATER_PARALLAX
void WaterParallax(inout vec3 wpos, in float lod) {
	const int maxLayers = 4;
	
	wpos.y -= 1.62;

	vec3 stepin = vec3(0.0);
	vec3 nwpos = normalize(wpos);
	nwpos /= max(0.01, abs(nwpos.y));

	for (int i = 0; i < maxLayers; i++) {
		float h = getwave(wpos + stepin + cameraPosition, lod);

		//if (abs(h - stepin.y) < 0.02) break;

		float diff = stepin.y - h;
		if (isEyeInWater == 1) diff = -diff;
		stepin += nwpos * diff * 0.5;
	}
	wpos += stepin;
	wpos.y += 1.62;
}
#endif

#ifdef WATER_CAUSTICS
float get_caustic (in vec3 wpos) {
	wpos += (64.0 - wpos.y) * (worldLightPosition / worldLightPosition.y);
	float w1 = getwave2(wpos, 1.0);
	vec3 n = get_water_normal(wpos, w1, 1.0, vec3(0.0, 1.0, 0.0));
	return pow3(dot(n, worldLightPosition) * 3.0 - 1.0);
}
#endif

#define WaterColor 1 // [0 1 2 3 5 6]
//0 Orginal || 1 New || 2 Green || 3 Blue || 4 Blood || 5 Clear || 6 Costom
#define WaterFogColor_R 0.1 //[0.001 0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.85 0.9 0.95 1.0 1.05 1.1 1.15 1.2 1.25 1.3 1.35 1.4 1.45 1.5 1.6 1.7 1.8 1.9 2.0]
#define WaterFogColor_G 0.6 //[0.001 0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.85 0.9 0.95 1.0 1.05 1.1 1.15 1.2 1.25 1.3 1.35 1.4 1.45 1.5 1.6 1.7 1.8 1.9 2.0]
#define WaterFogColor_B 0.8 //[0.001 0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.85 0.9 0.95 1.0 1.05 1.1 1.15 1.2 1.25 1.3 1.35 1.4 1.45 1.5 1.6 1.7 1.8 1.9 2.0]
#define WaterColor_A 0.2 //[0.0 0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.85 0.9 0.95 1.0]
#define DeepWaterFogColor_R 0.1 //[0.001 0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.85 0.9 0.95 1.0 1.05 1.1 1.15 1.2 1.25 1.3 1.35 1.4 1.45 1.5 1.6 1.7 1.8 1.9 2.0]
#define DeepWaterFogColor_G 0.6 //[0.001 0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.85 0.9 0.95 1.0 1.05 1.1 1.15 1.2 1.25 1.3 1.35 1.4 1.45 1.5 1.6 1.7 1.8 1.9 2.0]
#define DeepWaterFogColor_B 0.8 //[0.001 0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.85 0.9 0.95 1.0 1.05 1.1 1.15 1.2 1.25 1.3 1.35 1.4 1.45 1.5 1.6 1.7 1.8 1.9 2.0]
#define DeepWaterFogStrength 0.02 //[0.0 0.01 0.02 0.03 0.04 0.05 0.06 0.07 0.08 0.09 0.1]

vec3 getWaterColor() {
	if (isEyeInWater != 2) {
		#if WaterColor == 1|| WaterColor == 0
		return vec3(2.0, 0.8, 1.0);
		#elif WaterColor == 2
		return vec3(2.8,0.4,1.6);
		#elif WaterColor == 3
		return vec3(2.4,1.5,0.1);
		#elif WaterColor == 4
		return vec3(0.001,4.2,3.4);
		#elif WaterColor == 5
		return vec3(1.0);
		#else
		#define WaterColorWeight_R 1.0 //[0.001 0.005 0.1 0.2 0.3 0.4 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.83 0.85 0.87 0.9 0.93 0.95 0.96 0.97 0.98 0.99 1.0 1.01 1.02 1.03 1.04 1.05 1.07 1.1 1.13 1.15 1.17 1.2 1.25 1.3 1.35 1.4 1.45 1.5 1.6 1.7 1.8 1.9 2.0 2.5 3.0 3.5 4.0 4.5 5.0 6.0 7.0 8.0 9.0 10.0]
		#define WaterColorWeight_G 1.0 //[0.001 0.005 0.1 0.2 0.3 0.4 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.83 0.85 0.87 0.9 0.93 0.95 0.96 0.97 0.98 0.99 1.0 1.01 1.02 1.03 1.04 1.05 1.07 1.1 1.13 1.15 1.17 1.2 1.25 1.3 1.35 1.4 1.45 1.5 1.6 1.7 1.8 1.9 2.0 2.5 3.0 3.5 4.0 4.5 5.0 6.0 7.0 8.0 9.0 10.0]
		#define WaterColorWeight_B 1.0 //[0.001 0.005 0.1 0.2 0.3 0.4 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.83 0.85 0.87 0.9 0.93 0.95 0.96 0.97 0.98 0.99 1.0 1.01 1.02 1.03 1.04 1.05 1.07 1.1 1.13 1.15 1.17 1.2 1.25 1.3 1.35 1.4 1.45 1.5 1.6 1.7 1.8 1.9 2.0 2.5 3.0 3.5 4.0 4.5 5.0 6.0 7.0 8.0 9.0 10.0]
		const float waterA = (WaterFogColor_G + WaterFogColor_B) / (WaterFogColor_R * WaterColorWeight_R + 0.53);
		const float waterB = (WaterFogColor_R + WaterFogColor_B) / (WaterFogColor_G * WaterColorWeight_G + 0.53);
		const float waterC = (WaterFogColor_R + WaterFogColor_G) / (WaterFogColor_B * WaterColorWeight_B + 0.53);

		return vec3(waterA,waterB,waterC) * 0.1;
		#endif
	} else {
		return vec3(0.8, 1.0, 1.5);
	}
}

vec3 getWaterFogColor(float light) {
    #if WaterColor == 0
    return vec3(0.1,0.6,0.8) * light;
    #elif WaterColor == 1
    return mix(vec3(0.0015,0.025,0.05) * 0.4, vec3(0.1,0.6,0.8), light);
    #elif WaterColor == 2
    return mix(vec3(0.0015,0.02,0.03) * 0.4, vec3(0.54,0.76,0.41), light);
    #elif WaterColor == 3
    return mix(vec3(0.0005,0.001,0.07) * 0.4, vec3(0.08,0.33,0.60), light);
    #elif WaterColor == 4
    return mix(vec3(0.05,0.0023,0.006) * 0.4, vec3(0.8,0.015,0.03) * 0.73, light);
    #elif WaterColor == 5
    return mix(vec3(0.0015,0.02,0.03) * 0.4, vec3(0.03, 0.15, 0.4), light);
    #else
    return mix(vec3(DeepWaterFogColor_R, DeepWaterFogColor_G, DeepWaterFogColor_B) * DeepWaterFogStrength * 0.4, vec3(WaterFogColor_R,WaterFogColor_G,WaterFogColor_B), light);
    #endif
}

vec3 waterRender(vec3 wcolor, float lat, float ab) {
	wcolor *= 1.0 - Time.w * 0.6;
	#if WaterColor == 0
	const vec2 waterA1 = vec2(1.0, 0.0);
	#elif WaterColor == 1 || WaterColor == 3
	const vec2 waterA1 = vec2(1.0, 0.52);
	#elif WaterColor == 2
	const vec2 waterA1 = vec2(1.0, 0.32);
	#elif WaterColor == 4
	const vec2 waterA1 = vec2(0.6, -0.45);
	#elif WaterColor == 5
	const vec2 waterA1 = vec2(1.0, 0.72);
	#else
	const vec2 waterA1 = vec2(1.0);
	#endif
	
	#if WaterColor == 4
	const vec2 waterA2 = vec2(-0.35, 0.0);
	#elif WaterColor == 5
	const vec2 waterA2 = vec2(0.38, 0.58);
	#elif WaterColor == 6
	const vec2 waterA2 = vec2(WaterColor_A * 0.1);
	#else
	const vec2 waterA2 = vec2(0.0);
	#endif
	
	vec3 color;
	if (isEyeInWater == 0) {
		vec3 waterfog = lat * getWaterFogColor(max(luma(ambient) * 0.18, 0.0));
		color = mix(waterfog , wcolor, clamp((pow2(ab) * waterA1.x + waterA2.x), 0.1, 0.92));
	} else if (isEyeInWater == 1) {
		vec3 waterfog = getWaterFogColor(clamp(max(luma(ambient) * 0.18, 0.0) * lat, 0.0, 1.0)) * 0.6;
		color = mix(waterfog * 0.8, wcolor * (1.0 - rain0 * 0.5), clamp((pow2(ab) * waterA1.y + waterA2.y), 0.1, 0.92));
	} else {
		vec3 lavaColor = vec3(0.9, 0.01, 0.0) * lat;
		color = mix(lavaColor, wcolor, pow2(ab));
	}
	return color * (1.0 - max(Time.w * 0.5 + rain0 * 0.4, rain0 * 0.75));
}
