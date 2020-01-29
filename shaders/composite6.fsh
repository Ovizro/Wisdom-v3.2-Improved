#version 120
#include "/lib/compat.glsl"
#pragma optimize (on)

varying vec2 tex;
vec2 texcoord = tex;

uniform float aspectRatio;

#include "GlslConfig"

#define MAX_COLOR_RANGE 32.0

#define Tonemap_Curve 1.5 //[1.0 1.1 1.2 1.3 1.4 1.5 1.6 1.7 1.8 1.9 2.0]

#include "/lib/CompositeUniform.glsl.frag"
#include "/lib/Utilities.glsl.frag"
#include "/lib/Effects.glsl.frag"
//#include "/lib/lensFlare.glsl"

//#define BLOOM_DEBUG

void main() {
	#ifdef EIGHT_BIT
	vec3 color;
	bit8(color);
	#else
	vec3 color = texture2D(composite, texcoord).rgb;
	#endif

	float exposure = get_exposure();
	
	vec3 blur = color;
	#ifdef BLOOM
	vec3 b = bloom(color, blur);
	#ifdef BLOOM_DEBUG
	color = max(vec3(0.0), b) * exposure * (1.0 + float(isEyeInWater));
	#else
    color += max(vec3(0.0), b) * exposure * (1.0 + float(isEyeInWater));
    #endif
	#endif
	
/* DRAWBUFFERS:03 */
	gl_FragData[0] = vec4(max(vec3(0.0), blur * exposure * (1.0 + float(isEyeInWater))), 1.0f);
	gl_FragData[1] = vec4(color, 1.0f);
}
