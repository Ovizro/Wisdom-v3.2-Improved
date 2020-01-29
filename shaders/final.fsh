#version 120
#include "/lib/compat.glsl"
#pragma optimize (on)

uniform float aspectRatio;

//#define TONE_DEBUG

varying vec2 tex;
#ifdef TONE_DEBUG
vec2 texcoord = vec2(0.25 + fract(tex.x * 2.0) * 0.5, tex.y);
#else
vec2 texcoord = tex;
#endif

#include "GlslConfig"

#define MOTION_BLUR
#define LENS_FLARE
#define ANIMATION 0 	//[0 2 3]
// 0 off || 2 eyes open || 3 simple animation

#define Tonemap_Curve 1.5 //[1.0 1.1 1.2 1.3 1.4 1.5 1.6 1.7 1.8 1.9 2.0]

#include "/lib/CompositeUniform.glsl.frag"
#include "/lib/Utilities.glsl.frag"
#include "/lib/Tone.glsl"
#include "/lib/Material.glsl.frag"
#include "/lib/Effects.glsl.frag"
#if ANIMATION > 0
#include "/lib/Animation.glsl.frag"
#endif
#ifdef LENS_FLARE
#include "/lib/lensFlare.glsl"
#endif

// ==========================

#define SCREEN_RAIN_DROPS
#define DISTORTION_FIX

#ifdef DISTORTION_FIX
varying vec3 vUV;
varying vec2 vUVDot;
#endif

#define colorTexture_debug 0 //[0 1 2 3 4 5 6 7 8 9 10]
// 0 close || 1 colortex0/gcolor || 2 colortex1/gdepth || 3 colortex2/gnormal || 4 colortex3/composite || 5 colortex4/gaux1 || 6 colortex5/gaux2 || 7 colortex6/gaux3 || 8 colortex7/gaux4 || 9 depthtex0/depthtex || 10 depthtex1
//#define BLACK_AND_WHITE
//#define BLOOM_DEBUG

Mask mask;
Tone tone;

void main() {
	#ifdef DISTORTION_FIX
	vec3 distort = dot(vUVDot, vUVDot) * vec3(-0.5, -0.5, -1.0) + vUV;
	texcoord = distort.xy / distort.z;
	#endif
	
	#ifdef SCREEN_RAIN_DROPS
	float real_strength = rainStrength * smoothstep(0.8, 1.0, float(eyeBrightness.y) / 240.0) * smoothstep(0.0, 0.01, rainStrength) * smoothstep(0.5, 1.0, BiomeType.y);
	
	//if ((rainStrength > 0.0) && (BiomeType.y == 1.0)) 
	vec2 adj_tex = texcoord * vec2(aspectRatio, 1.0);
	float n = noise((adj_tex + vec2(0.1, 1.0) * frametime) * 2.0);
	n -= 0.6 * abs(noise((adj_tex * 2.0 + vec2(0.1, 1.0) * frametime) * 3.0));
	n *= (n * n) * (n * n);
	n *= real_strength * 0.007;
	
	vec2 uv = texcoord + vec2(n, -n);
	texcoord = mix(uv, texcoord, pow(abs(uv - vec2(0.5)) * 2.0, vec2(2.0)));
	#endif

	vec4 speculardata = texture2D(gaux1, texcoord);
	float flag = speculardata.a;

	// build up mask
	init_mask(mask, flag);
	// build up tone
	init_tone(tone, texcoord);

	#ifdef MOTION_BLUR
	if (flag > 0.11 && !mask.is_hand) motion_blur(composite, tone.color, texcoord, fetch_vpos(texcoord, depthtex0).xyz);
	#endif

	#if DOF > 0
	dof(tone, texcoord,  mask.is_hand);
	#endif	
	
	#ifdef LENS_FLARE
	getLensFlare(tone);
	#endif

	#if ANIMATION > 0
	animation(tone, texcoord);
	#endif
	
	//TONED
	Hue_Adjustment(tone);
	
	#if colorTexture_debug >= 1
	vec4 colortex;
	switch(colorTexture_debug) {
		case 1:
		colortex = texture2D(colortex0,texcoord);
		break;
		case 2:
		colortex = texture2D(colortex1,texcoord);
		break;
		case 3:
		colortex = texture2D(colortex2,texcoord);
		break;
		case 4:
		colortex = texture2D(composite,texcoord);
		break;
		case 5:
		colortex = texture2D(gaux1,texcoord);
		break;
		case 6:
		colortex = texture2D(gaux2,texcoord).gggg;
		break;
		case 7:
		colortex = texture2D(gaux3,texcoord);
		break;
		case 8:
		colortex = texture2D(gaux4,texcoord);
		break;
		case 9:
		colortex = pow(texture2D(depthtex0,texcoord), vec4(100.0));
		break;
		case 10:
		colortex = pow(texture2D(depthtex1,texcoord), vec4(100.0));
		break;
	}
	tone.color = colortex.rgb;//colortex.a;
	//color = loadTexture(gaux3, 0, texcoord).rgb;
	#endif

	gl_FragColor = vec4(tone.color, 1.0f);
}