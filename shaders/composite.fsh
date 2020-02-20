#version 120
#include "/lib/compat.glsl"
#pragma optimize (on)

const int RGB8 = 0, R11F_G11F_B10F = 1, RGB10_A2 = 2, RGBA16 = 3, RGBA8 = 4, RGB16 = 5, RGBA32F = 6;

const int colortex0Format = RGB10_A2;
const int colortex1Format = RGBA16;
const int gnormalFormat = RGBA16;
const int compositeFormat = R11F_G11F_B10F;
const int gaux1Format = RGBA8;
const int gaux2Format = RGBA16;
const int gaux3Format = RGBA32F;
const int gaux4Format = RGBA8;
const int noiseTextureResolution = 512;
const int depthtex2Format = RGBA8;
const int shadowcolor0Format = RGB16;

const float eyeBrightnessHalflife = 13.5f;
const float wetnessHalflife = 600.0f;
const float drynessHalflife = 1200.0f;
const float centerDepthHalflife = 5.0f;

const bool compositeMipmapEnabled = false;

varying vec2 texcoord;

#include "GlslConfig"

#include "/lib/CompositeUniform.glsl.frag"
#include "/lib/Utilities.glsl.frag"
#include "/lib/Material.glsl.frag"
#include "/lib/Lighting.glsl.frag"
#include "/lib/Atmosphere.glsl.frag"

vec2 mclight = texture2D(gaux2, texcoord).xy;

Mask mask;
Material land;

void main() {
	// rebuild hybrid flag
	vec3 normaltex = texture2D(gnormal, texcoord).rgb;
	vec3 water_normal_tex = texture2D(colortex1, texcoord).rgb;
	if (water_normal_tex.b == 1.0) water_normal_tex.b = 0.0;
	float flag = (normaltex.b < 0.11 && normaltex.b > 0.01) ? normaltex.b : max(normaltex.b, water_normal_tex.b);
	if (normaltex.b < 0.09 && water_normal_tex.b > 0.9) flag = 0.99;
	if (normaltex.b > 0.19 && normaltex.b < 0.21 && water_normal_tex.b > 0.98) flag = 0.45;


	// build up mask
	init_mask(mask, flag);

	vec3 color = vec3(0.0f);
	if (!mask.is_sky) {
		material_sample(land, texcoord);
		color.r = calcAO(land.N, land.cdepth, land.vpos, texcoord);
		#ifdef HQ_AO
		color.gb = normaltex.rg;
		#endif
	}

	// rebuild hybrid data
	vec4 specular_data = texture2D(gaux1, texcoord);//flag > 0.89f ? texture2D(gaux4, texcoord) : 
	specular_data.a = flag;

/* DRAWBUFFERS:234 */
	gl_FragData[0] = vec4(normaltex.xy, water_normal_tex.xy);
	gl_FragData[1] = vec4(color, 1.0f);
	gl_FragData[2] = specular_data;
}
