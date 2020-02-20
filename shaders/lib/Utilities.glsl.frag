#if !(defined _INCLUDE_UTILITY)
#define _INCLUDE_UTILITY

#include "/lib/CompositeUniform.glsl.frag"

const float PI = 3.141592653f;

#define SUN_COLOR_TEMPERATURE_DEBUG 0 //[0 500 750 1000 1250 1500 1750 2000 2250 2500 2750 3000 3250 3500 3750 4000 4250 4500 4750 5000 5250 5500 5750 6000 6250 6500 6750 7000 7250 7500 7750 8000 8250 8500 8750 9000 10000 15000 20000 30000 40000]

#define SUN_LIGHT_COLOR 0 	//[0 1 2 3]
//0 Orginal || 1 New || 2 Cold || 3 Costom

#define MORNING_LIGHT 3.1 	//[2.5 2.6 2.7 2.8 2.9 3.0 3.1 3.2 3.3 3.4 3.5 3.6 3.7 3.8 3.9 4.0]
#define NOON_LIGHT 3.7		//[3.0 3.1 3.2 3.3 3.4 3.5 3.6 3.7 3.8 3.9 4.0 4.1 4.2 4.3 4.4 4.5 4.6 4.7 4.8 4.9 5.0]
#define EVENING_LIGHT 3.2	//[2.5 2.6 2.7 2.8 2.9 3.0 3.1 3.2 3.3 3.4 3.5 3.6 3.7 3.8 3.9 4.0]
#define NIGHT_LIGHT 0.15 	//[0.0001 0.01 0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6 0.65 0.7 0.75 0.8]

#define BASIC_SUN_COLOR_TEMPERATURE 5500.0 		//[4000.0 4500.0 5000.0 5500.0 6000.0 6500.0 7000.0]
#define MORNING_COLOR_TEMPERATURE 2000.0 		//[1000.0 1250.0 1500.0 1750.0 2000.0 2250.0 2500.0 2750.0 3000.0 3250.0 3500.0]
#define NOON_COLOR_TEMPERATURE 6500.0 			//[5000.0 5250.0 5500.0 5750.0 6000.0 6250.0 6500.0 6750.0 7000.0 7500.0]
#define EVENING_COLOR_TEMPERATURE 1500.0 		//[1000.0 1250.0 1500.0 1750.0 2000.0 2250.0 2500.0 2750.0 3000.0 3250.0 3500.0]
#define BASIC_MOON_COLOR_TEMPERATURE 6250.0 	//[3000.0 3250.0 3500.0 3750.0 4000.0 4250.0 4500.0 4750.0 5000.0 5250.0 5500.0 5750.0 6000.0 6250.0 6500.0 6750.0 7000.0 7250.0 7500.0 7750.0 8000.0 8250.0 8500.0 8750.0 9000.0 10000.0 12000.0 15000.0 20000.0 30000.0 40000.0]
#define MIDNIGHT_COLOR_TEMPERATURE 7750.0 		//[6000.0 6250.0 6500.0 6750.0 7000.0 7250.0 7500.0 7750.0 8000.0 8250.0 8500.0 8750.0 9000.0 10000.0 12000.0 15000.0 20000.0 30000.0 40000.0]
#define CLOUDY_COLOR_TEMPERATURE 7500.0 		//[6000.0 6250.0 6500.0 6750.0 7000.0 7250.0 7500.0 7750.0 8000.0]

varying vec3 suncolor;
varying vec3 ambient;
varying float extShadow;
varying vec3 worldLightPosition;

varying float cloud_coverage;
varying float wind_speed;

#define hash_fast(p) fract(mod(p.x, 1.0) * 73758.23f - p.y)

float16_t hash(f16vec2 p) {
	vec3 p3 = fract(vec3(p.xyx) * 0.2031);
	p3 += dot(p3, p3.yzx + 19.19);
	return fract((p3.x + p3.y) * p3.z);
}

float16_t noise(f16vec2 p) {
	f16vec2 i = floor(p);
	f16vec2 f = fract(p);
	f16vec2 u = (f * f) * fma(f16vec2(-2.0f), f, f16vec2(3.0f));
	return fma(2.0f, mix(
		mix(hash(i),                      hash(i + f16vec2(1.0f,0.0f)), u.x),
		mix(hash(i + f16vec2(0.0f,1.0f)), hash(i + f16vec2(1.0f,1.0f)), u.x),
	u.y), -1.0f);
}

vec3 getLightColor(float ColorTemperature) {

    const vec3 c10 = vec3(1.0, 0.0337, 0.0);
	const vec3 c15 = vec3(1.0, 0.1578, 0.0);
	const vec3 c20 = vec3(1.0, 0.2647, 0.0033);
	const vec3 c30 = vec3(1.0, 0.487, 0.1411);
	const vec3 c35 = vec3(1.0, 0.5809, 0.2433);
	const vec3 c40 = vec3(1.0, 0.6636, 0.3583);
	const vec3 c50 = vec3(1.0, 0.7992, 0.6045); 
	const vec3 c60 = vec3(1.0, 0.9019, 0.8473);
	const vec3 c66 = vec3(0.9917, 0.9513, 0.9844);
	const vec3 c70 = vec3(0.9337, 0.9150, 1.0);
	const vec3 c80 = vec3(0.7874, 0.8187, 1.0);
	const vec3 c90 = vec3(0.6925, 0.7522, 1.0);
	const vec3 c120 = vec3(0.5431, 0.6389, 1.0);
	const vec3 c200 = vec3(0.4196, 0.5339, 1.0);
	const vec3 c400 = vec3(0.3563, 0.4745, 1.0);

    vec3 lightColor = ((linearstep(500.0, 950.0, ColorTemperature)\
		- linearstep(1000.0, 1500.0, ColorTemperature)) * c10\
		+ (linearstep(1000.0, 1500.0, ColorTemperature)\
		- linearstep(1500.0, 2000.0, ColorTemperature)) * c15\
		+ (linearstep(1500.0, 2000.0, ColorTemperature)\
		- linearstep(2000.0, 3000.0, ColorTemperature)) * c20\
		+ (linearstep(2000.0, 3000.0, ColorTemperature)\
		- linearstep(3000.0, 3500.0, ColorTemperature)) * c30\
		+ (linearstep(3000.0, 3500.0, ColorTemperature)\
		- linearstep(3500.0, 4000.0, ColorTemperature)) * c35\
		+ (linearstep(3500.0, 4000.0, ColorTemperature)\
		- linearstep(4000.0, 5000.0, ColorTemperature)) * c40\
		+ (linearstep(4000.0, 5000.0, ColorTemperature)\
		- linearstep(5000.0, 6000.0, ColorTemperature)) * c50\
		+ (linearstep(5000.0, 6000.0, ColorTemperature)\
		- linearstep(6000.0, 6600.0, ColorTemperature)) * c60\
		+ (linearstep(6000.0, 6600.0, ColorTemperature)\
		- linearstep(6600.0, 7000.0, ColorTemperature)) * c66\
		+ (linearstep(6600.0, 7000.0, ColorTemperature)\
		- linearstep(7000.0, 8000.0, ColorTemperature)) * c70\
		+ (linearstep(7000.0, 8000.0, ColorTemperature)\
		- linearstep(8000.0, 9000.0, ColorTemperature)) * c80\
		+ (linearstep(8000.0, 9000.0, ColorTemperature)\
		- linearstep(9000.0, 12000.0, ColorTemperature)) * c90\
		+ (linearstep(9000.0, 12000.0, ColorTemperature)\
		- linearstep(12000.0, 20000.0, ColorTemperature)) * c120\
		+ (linearstep(12000.0, 20000.0, ColorTemperature)\
		- linearstep(20000.0, 40000.0, ColorTemperature)) * c200\
		+ (linearstep(20000.0, 40000.0, ColorTemperature)) * c400);

	//lightColor /= max(dot(lightColor, vec3(0.3333)), (1.0 - smoothstep(500.0, 800.0, ColorTemperature)));

    return lightColor;
}

float getSunColorTemperature(in vec4 time) {
	
	#if SUN_LIGHT_COLOR == 0
    float base = 5500.0;
	float i1 = 3500.0;
	float i2 = 750.0;
	float i3 = 3750.0;
	float i4 = 2000.0;
	float i5 = 1000.0;
	float i6 = 1500.0;
	#elif SUN_LIGHT_COLOR == 1
	float base = 4000.0;
	float i1 = 2250.0;
	float i2 = 1500.0;
	float i3 = 1000.0;
	float i4 = 1500.0;
	float i5 = 1000.0;
	float i6 = 1500.0;
	#elif SUN_LIGHT_COLOR == 2
	float base = 6000.0;
	float i1 = 3250.0;
	float i2 = 14250.0;
	float i3 = 3250.0;
	float i4 = 2500.0;
	float i5 = 1250.0;
	float i6 = 2250.0;
	#elif SUN_LIGHT_COLOR == 3
	float base = BASIC_SUN_COLOR_TEMPERATURE;
	float i1 = BASIC_SUN_COLOR_TEMPERATURE - MORNING_COLOR_TEMPERATURE;
	float i2 = NOON_COLOR_TEMPERATURE - BASIC_SUN_COLOR_TEMPERATURE;
	float i3 = BASIC_SUN_COLOR_TEMPERATURE - EVENING_COLOR_TEMPERATURE;
	float i4 = BASIC_MOON_COLOR_TEMPERATURE - BASIC_SUN_COLOR_TEMPERATURE;
	float i5 = CLOUDY_COLOR_TEMPERATURE - BASIC_SUN_COLOR_TEMPERATURE;
	float i6 = MIDNIGHT_COLOR_TEMPERATURE - BASIC_MOON_COLOR_TEMPERATURE;
	#endif

	float timeNoon = step(1.0, time.y);
	float timeNight = step(1.0, time.w);
	
	float ColorTemperature = (base + mix(((1.0 - cos(PI / 4000.0 * (float(worldTime) - 2000.0))) / 2.0 * i2 * timeNoon - i1 * time.x - i3 * time.z), (i4 + (1.0 - cos(PI / 5125.0 * (float(worldTime) - 12750.0))) / 2.0 * i6), timeNight) + i5 * rain0);
	
	return ColorTemperature;
}

/*
 *==============================================================================
 *------------------------------------------------------------------------------
 *
 * 								~Vertex stuff~
 *
 *------------------------------------------------------------------------------
 *==============================================================================
 */
#ifdef _VERTEX_SHADER_

void calcCommons() {
	float day = float(worldTime) / 24000.0;
	float day_cycle = mix(float(moonPhase), mod(float(moonPhase + 1), 8.0), day) + frametime * 0.0001;
	cloud_coverage = mix(noise(vec2(day_cycle, 0.0)) * 0.3 + 0.1, 0.7, max(rain0, wetness));
	wind_speed = mix(noise(vec2(day_cycle * 2.0, 0.0)) * 0.5 + 1.0, 2.0, rainStrength);
	
	#if SUN_COLOR_TEMPERATURE_DEBUG == 0
	float colorTemperature = getSunColorTemperature(SunTime0);
	#else
	float colorTemperature = float(SUN_COLOR_TEMPERATURE_DEBUG);
	#endif
	
	suncolor = getLightColor(colorTemperature);
    suncolor *= max((1.0 - cloud_coverage * 1.2 - rain0 * 0.4), 0.0) * dot(SunTime0, vec4(MORNING_LIGHT, NOON_LIGHT, EVENING_LIGHT, NIGHT_LIGHT));

	extShadow = (clamp((float(worldTime)-12350.0)/100.0,0.0,1.0)-clamp((float(worldTime)-13050.0)/100.0,0.0,1.0) + clamp((float(worldTime)-22800.0)/200.0,0.0,1.0)-clamp((float(worldTime)-23400.0)/200.0,0.0,1.0));

	#ifndef SPACE
	const vec3 ambient_sunrise = vec3(0.543, 0.772, 0.786) * 0.27;
	const vec3 ambient_noon = vec3(0.686, 0.702, 0.73) * 0.34;
	const vec3 ambient_sunset = vec3(0.543, 0.772, 0.747) * 0.26;
	const vec3 ambient_midnight = vec3(0.06, 0.088, 0.117) * 0.1;

	ambient = ambient_sunrise * Time.x + ambient_noon * Time.y + ambient_sunset * Time.z + ambient_midnight * Time.w;
	#else
	ambient = vec3(0.0);
	suncolor = vec3(1.0);
	#endif

	worldLightPosition = mat3(gbufferModelViewInverse) * normalize(shadowLightPosition);
}

#else

/*
 *==============================================================================
 *------------------------------------------------------------------------------
 *
 * 								~Fragment stuff~
 *
 *------------------------------------------------------------------------------
 *==============================================================================
 */

const vec2 circle_offsets[25] = vec2[25](
	vec2(-0.48946f,-0.35868f),
	vec2(-0.17172f, 0.62722f),
	vec2(-0.47095f,-0.01774f),
	vec2(-0.99106f, 0.03832f),
	vec2(-0.21013f, 0.20347f),
	vec2(-0.78895f,-0.56715f),
	vec2(-0.10378f,-0.15832f),
	vec2(-0.57284f, 0.3417f ),
	vec2(-0.18633f, 0.5698f ),
	vec2( 0.35618f, 0.00714f),
	vec2( 0.28683f,-0.54632f),
	vec2(-0.4641f ,-0.88041f),
	vec2( 0.19694f, 0.6237f ),
	vec2( 0.69991f, 0.6357f ),
	vec2(-0.34625f, 0.89663f),
	vec2( 0.1726f , 0.28329f),
	vec2( 0.41492f, 0.8816f ),
	vec2( 0.1369f ,-0.97162f),
	vec2(-0.6272f , 0.67213f),
	vec2(-0.8974f , 0.42719f),
	vec2( 0.55519f, 0.32407f),
	vec2( 0.94871f, 0.26051f),
	vec2( 0.71401f,-0.3126f ),
	vec2( 0.04403f, 0.93637f),
	vec2( 0.62031f,-0.66735f)
);
const float circle_count = 25.0;

// Color adjustment

const vec3 agamma = vec3(0.8 / 2.2f);

float luma(in vec3 color) { return dot(color,vec3(0.2126, 0.7152, 0.0722)); }

#define EXPOSURE 1.2 // [0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0 1.1 1.2 1.3 1.4 1.5 1.6 1.7 1.8 1.9 2.0]

//==============================================================================
// Light utilities
//==============================================================================

//#define AVERAGE_EXPOSURE
#ifdef AVERAGE_EXPOSURE
float get_exposure() {
	float basic_exp = EXPOSURE * (1.8 - clamp(pow(eyeBrightnessSmooth.y / 240.0, 6.0) * luma(suncolor), 0.0, 1.2));

	#ifdef BLOOM
	vec3 center = texture2D(colortex0, vec2(0.5) * 0.125 + vec2(0.0f, 0.25f) + vec2(0.000f, 0.025f)).rgb;
	#else
	vec3 center = texture2D(composite, vec2(0.5)).rgb;
	#endif
	float avr_exp = (0.5 - clamp(luma(center), 0.0, 2.0)) * 1.5;
	basic_exp = mix(basic_exp, max(0.1, basic_exp + avr_exp), 0.8);

	return basic_exp;
}
#else
float get_exposure() {
	return EXPOSURE * (1.8 - clamp(pow(eyeBrightnessSmooth.y / 240.0, 6.0) * luma(suncolor), 0.0, 1.2));
}
#endif

//==============================================================================
// Vector stuff
//==============================================================================

float fov = atan(1./gbufferProjection[1][1]);
float mulfov = (isEyeInWater == 1) ? gbufferProjection[1][1]*tan(fov * 0.85):1.0;

vec4 fetch_vpos (vec3 spos) {
	vec4 v = gbufferProjectionInverse * vec4(fma(spos, vec3(2.0f), vec3(-1.0)), 1.0);
	v /= v.w;
	v.xy *= mulfov;

	return v;
}

vec4 fetch_vpos (vec2 uv, float z) {
	return fetch_vpos(vec3(uv, z));
}

vec4 fetch_vpos (vec2 uv, sampler2D sam) {
	return fetch_vpos(uv, texture2D(sam, uv).x);
}

float16_t linearizeDepth(float16_t depth) { return (2.0 * near) / (far + near - depth * (far - near));}

float getLinearDepthOfViewCoord(vec3 viewCoord) {
	vec4 p = vec4(viewCoord, 1.0);
	p = gbufferProjection * p;
	p /= p.w;
	return linearizeDepth(fma(p.z, 0.5f, 0.5f));
}

f16vec2 screen_project (vec3 vpos) {
	f16vec4 p = f16mat4(gbufferProjection) * f16vec4(vpos, 1.0f);
	p /= p.w;
	if(abs(p.z) > 1)
		return f16vec2(-1.0);
	return fma(p.st, vec2(0.5f), vec2(0.5f));
}

#endif

float noise_tex(in vec2 p) {
	return fma(texture2D(noisetex, fract(p * 0.0020173)).r, 2.0, -1.0);
}

float16_t bayer2(f16vec2 a){
    a = floor(a);
    return fract( dot(a, vec2(.5f, a.y * .75f)) );
}

#define bayer4(a)   (bayer2( .5f*(a))*.25f+bayer2(a))
#define bayer8(a)   (bayer4( .5f*(a))*.25f+bayer2(a))
#define bayer16(a)  (bayer8( .5f*(a))*.25f+bayer2(a))
#define bayer32(a)  (bayer16(.5f*(a))*.25f+bayer2(a))
#define bayer64(a)  (bayer32(.5f*(a))*.25f+bayer2(a))

float16_t bayer_4x4(in f16vec2 pos, in f16vec2 view) {
	return bayer4(pos * view);
}

float16_t bayer_8x8(in f16vec2 pos, in f16vec2 view) {
	return bayer8(pos * view);
}

float16_t bayer_16x16(in f16vec2 pos, in f16vec2 view) {
	return bayer16(pos * view);
}

float16_t bayer_32x32(in f16vec2 pos, in f16vec2 view) {
	return bayer32(pos * view);
}

float16_t bayer_64x64(in f16vec2 pos, in f16vec2 view) {
	return bayer64(pos * view);
}

f16vec2 hash22(f16vec2 p){
    f16vec2 p2 = fract(p * vec2(.1031f,.1030f));
    p2 += dot(p2, p2.yx+19.19f);
    return fract((p2.x+p2.y)*p2);
}

float simplex2D(vec2 p){
    const float K1 = (sqrt(3.)-1.)/2.;
    const float K2 = (3.-sqrt(3.))/6.;
    const float K3 = K2*2.;

    vec2 i = floor( p + dot(p,vec2(K1)) );

    vec2 a = p - i + dot(i,vec2(K2));
    vec2 o = 1.-clamp((a.yx-a)*1.e35,0.,1.);
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + K3;

    vec3 h = clamp( .5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0. ,1. );

    h*=h;
    h*=h;

    vec3 n = vec3(
        dot(a,hash22(i   )-.5),
        dot(b,hash22(i+o )-.5),
        dot(c,hash22(i+1.)-.5)
    );

    return dot(n,h)*140.;
}

#define Positive(a) max(0.0000001, a)

/*const vec2 uvBasic[4] = vec2[4](
    vec2(0.0, 0.0),
    vec2(0.0, 0.5),
    vec2(0.5, 0.0),
    vec2(0.5, 0.5)
);

vec4 saveTexture(in sampler2D tex, int key, in vec2 texcood) {
    vec2 uv = (texcood - uvBasic[key]) * 2.0;
    vec4 texColor = vec4(0.0);
    if(uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) {
        texColor = texture2D(tex, uv);
    }
    return texColor;
}

vec4 loadTexture(in sampler2D tex, int key, in vec2 texcood) {
    vec2 uv = texcood * 0.5 + uvBasic[key];
    vec4 texColor = texture2D(tex, uv);
    return texColor;
}*/

#endif
