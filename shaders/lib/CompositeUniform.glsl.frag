#if !(defined _INCLUDE_UNIFORM)
#define _INCLUDE_UNIFORM

uniform float near;
uniform float far;

#ifndef VIEW_WIDTH
#define VIEW_WIDTH
uniform float viewWidth;                        // viewWidth
uniform float viewHeight;                       // viewHeight
#if MC_VERSION >= 11202
	uniform vec2 pixel;
#else
	vec2 pixel = 1.0 / vec2(viewWidth, viewHeight);
#endif
#endif

uniform float wetness;
uniform float rainStrength;
uniform float centerDepthSmooth;

uniform ivec2 eyeBrightnessSmooth;
uniform ivec2 eyeBrightness;

uniform int isEyeInWater;

#ifndef _VERTEX_SHADER_
uniform sampler2D colortex0;
uniform sampler2D colortex1;
uniform sampler2D colortex2;
uniform sampler2D gnormal;
uniform sampler2D composite;
uniform sampler2D gaux1;
uniform sampler2D gaux2;
uniform sampler2D gaux3;
uniform sampler2D gaux4;

uniform sampler2D depthtex0;
uniform sampler2D depthtex1;

uniform sampler2D shadowtex1;
#endif

uniform sampler2D noisetex;

uniform mat4 shadowModelView;
uniform mat4 shadowProjection;

uniform mat4 gbufferPreviousModelView;
uniform mat4 gbufferModelView;
uniform mat4 gbufferModelViewInverse;
uniform mat4 gbufferPreviousProjection;
uniform mat4 gbufferProjection;
uniform mat4 gbufferProjectionInverse;

uniform vec3 sunPosition;
uniform vec3 moonPosition;
uniform vec3 upPosition;
uniform vec3 shadowLightPosition;
vec3 lightPosition = normalize(shadowLightPosition);
uniform vec3 upVec;

uniform vec3 cameraPosition;
uniform vec3 previousCameraPosition;

uniform vec3 skyColor;

uniform float frameTimeCounter;
uniform int worldTime;
uniform int moonPhase;

//#define WorldTimeAnimation

#ifdef WorldTimeAnimation
float frametime = float(worldTime)/20.0;
#else
float frametime = frameTimeCounter;
#endif

#if MC_VERSION >= 11202
uniform vec3 BiomeType;

uniform vec4 Time;
uniform vec4 nTime;
uniform vec4 SunTime0;

uniform vec3 sunVector;
uniform vec3 moonVector;
uniform vec3 shaderLightVector;
#else
const vec3 BiomeType = vec3(0.0, 1.0, 0.5);

vec4 TimeSet(int worldTime) {
    float wTimeF = float(worldTime);

	float TimeSunrise = (smoothstep(23200.0, 23600.0, wTimeF) + 1.0 - (clamp(wTimeF, 0.0, 2000.0)/2000.0));
	float TimeNoon     = ((clamp(wTimeF, 0.0, 2000.0)) / 2000.0) - ((clamp(wTimeF, 10000.0, 12000.0) - 10000.0) / 2000.0);
	float TimeSunset = ((clamp(wTimeF, 10000.0, 12000.0) - 10000.0) / 2000.0 - smoothstep(12600.0, 12770.0, wTimeF));
	float TimeMidnight = (smoothstep(12600.0, 12770.0, wTimeF) - smoothstep(23200.0, 23600.0, wTimeF));
	
	vec4 dayTime = vec4(TimeSunrise, TimeNoon, TimeSunset, TimeMidnight);
	return dayTime;
}
vec4 SunTimeSet(int worldTime) {
    float wTimeF = float(worldTime);

	float TimeSunrise = (smoothstep(23000.0, 24000.0, wTimeF) + 1.0 - linearstep(0.0, 2000.0, wTimeF));
	float TimeNoon     = (linearstep(0.0, 2000.0, wTimeF) - linearstep(10000.0, 12000.0, wTimeF));
	float TimeSunset = (linearstep(10000.0, 12000.0, wTimeF) - smoothstep(12500.0, 12800.0, wTimeF));
	float TimeMidnight = (smoothstep(12500.0, 12800.0, wTimeF) - smoothstep(23000.0, 24000.0, wTimeF));
	
	vec4 dayTime = vec4(TimeSunrise, TimeNoon, TimeSunset, TimeMidnight);
	return dayTime;
}
vec4 MoonTimeSet(int worldTime) {
    float wTimeF = float(worldTime);

	float TimeMoonrise = (smoothstep(12890.0, 13100.0, wTimeF) - clamp((worldTime * 1.0 - 13250.0) / 1000.0, 0.0, 1.0));
	float TimeMidnight     = (clamp((worldTime * 1.0 - 13250.0) / 1000.0, 0.0, 1.0) - clamp((worldTime * 1.0 - 21000.0) / 1500.0, 0.0, 1.0));
	float TimeMoonset = (clamp((worldTime * 1.0 - 21000.0) / 1500.0, 0.0, 1.0) - smoothstep(22700.0, 23100.0, wTimeF));
	float TimeDay = (smoothstep(22700.0, 23100.0, wTimeF) + 1.0 - smoothstep(12890.0, 13100.0, wTimeF));
	
	vec4 moonTime = vec4(TimeMoonrise, TimeMidnight, TimeMoonset, TimeDay);
	return moonTime;
}

vec4 Time = TimeSet(worldTime);
vec4 SunTime0 = SunTimeSet(worldTime);
vec4 nTime = MoonTimeSet(worldTime);

#ifdef _VERTEX_SHADER_
vec3 sunVector 			= 	mat3(gbufferModelViewInverse) * normalize(sunPosition);
vec3 shaderLightVector	= 	mat3(gbufferModelViewInverse) * normalize(shadowLightPosition);
#endif
#endif

float rain0 = rainStrength * smoothstep(0.0, 0.5, BiomeType.y);

float isEyeInWater0 = step(1.0, float(isEyeInWater));
float isEyeInLava = step(2.0, float(isEyeInWater));
float isEyeInWater1 = (isEyeInWater0 - isEyeInLava);

#endif
