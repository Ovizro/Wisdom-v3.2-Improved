#version 120
#include "/lib/compat.glsl"
#pragma optimize (on)

varying vec2 texcoord;

varying vec3 sunLight;
varying vec3 sunraw;
varying vec3 ambientU;

const bool colortex1MipmapEnabled = true;

uniform sampler2D shadowtex0;
uniform sampler2D shadowcolor0;

#include "GlslConfig"

#define WATER_CAUSTICS

#define LIGHT_COLOR_TEMPERATURE 2500 //[1000 1250 1500 1750 2000 2250 2500 2750 3000 3250 3500 3750 4000 4250 4500 4750 5000 5250 5500 5750 6000 6250 6500 6750 7000 7250 7500 7750 8000 8250 8500 8750 9000]
#define LIGHT_LEVEL 0.2 //[0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.85 0.9 0.95 1.0]

//#define SPACE
#define DIRECTIONAL_LIGHTMAP
#define FORCE_GROUND_WETNESS

#include "/lib/CompositeUniform.glsl.frag"
#include "/lib/Utilities.glsl.frag"
#include "/lib/Material.glsl.frag"
#include "/lib/Lighting.glsl.frag"
#include "/lib/Atmosphere.glsl.frag"
#include "/lib/Water.glsl.frag"

vec4 mclight = texture2D(gaux2, texcoord);

LightSource torch;
LightSource amb;
LightSourcePBR sun;
Material land;
Material frag;

Mask mask;

#ifdef WISDOM_AMBIENT_OCCLUSION
#ifdef HQ_AO
//=========== BLUR AO =============
float16_t blurAO (vec2 uv, vec3 N) {
	float16_t z  = texture2D(composite, uv).r;
	float16_t x  = z * 0.2941176f;
	f16vec3  y  = texture2D(composite, uv + vec2(0.0, -pixel.y * 1.333333)).rgb;
	         x += mix(z, y.x, max(0.0, dot(normalDecode(y.yz), N))) * 0.352941176f;
	         y  = texture2D(composite, uv + vec2(0.0,  pixel.y * 1.333333)).rgb;
	         x += mix(z, y.x, max(0.0, dot(normalDecode(y.yz), N))) * 0.352941176f;
	return x;
}
//=================================
#endif
#endif

//#define PRIME_RENDER
//#define MODERN

#define CLOUD_SHADOW

void main() {
	// rebuild hybrid flag
	vec4 speculardata = texture2D(gaux1, texcoord);
	float flag = speculardata.a;

	// build up mask
	init_mask(mask, flag);
	material_sample(land, texcoord);
	
	vec3 color = vec3(0.0f);
	float shadow = 0.0;

	// build up materials & light sources
	if (!mask.is_sky) {
        vec3 torch_color = getLightColor(LIGHT_COLOR_TEMPERATURE * 1.0) * LIGHT_LEVEL * 0.02;
		
		torch.color = torch_color;
		torch.attenuation = light_mclightmap_attenuation(mclight.x);

		
		#ifdef PRIME_RENDER
		land.albedo = vec3(0.5);
		#endif
		
		vec3 spos = wpos2shadowpos(land.wpos);
		float lsa = light_shadow_autobias(land.cdepthN);
		vec3 suncolor0 = suncolor;

		float thickness = 1.0;
		float thickness0 = 1.0;
		
		shadow = light_fetch_shadow(shadowtex1, lsa, spos, thickness);
		float shadow0 = light_fetch_shadow(shadowtex0, lsa, spos, thickness0);
		
		if (isEyeInWater == 1) {
			shadow = max(shadow, 1.0 - mclight.y);
			shadow0 = max(shadow0, 1.0 - mclight.y);
		}
		
		#ifdef COLORFUL_SHADOW
		colorShadow(shadowcolor0, shadow, shadow0, spos, suncolor0);
		#endif
		
		sun.light.color = suncolor0;
		sun.light.attenuation = 1.0 - max(extShadow, shadow);
		
		#ifdef WATER_CAUSTICS
		if (((isEyeInWater == 0 && mask.is_trans) || (isEyeInWater == 1 && !mask.is_water)) && shadow < 0.95) {
			sun.light.attenuation *= fma(worldLightPosition.y, 0.98, 0.02) * (1.3 - get_caustic(land.wpos + cameraPosition));

			if (isEyeInWater == 1) sun.light.attenuation *= mclight.y * 1.2;
		}
		#endif
		sun.L = lightPosition;

		#ifdef CLOUD_SHADOW
		vec4 clouds = calc_clouds(worldLightPosition * 512.0f, cameraPosition + land.wpos, 0.0, sunLight);
		sun.light.attenuation *= 1.0 - clouds.a * 1.6;
		#endif

		amb.color = ambient;
		amb.attenuation = light_mclightmap_simulated_GI(mclight.y, sun.L, land.N);

		#ifdef DIRECTIONAL_LIGHTMAP
		if (!mask.is_hand) {
			vec3 T = normalize(dFdx(land.vpos));
			vec3 B = normalize(dFdy(land.vpos));
			vec3 N = cross(T, B);

			amb.attenuation *= lightmap_normals(land.N, mclight.y, T, B, N);
			torch.attenuation *= lightmap_normals(land.N, mclight.x, T, B, N);
		}
		#endif

		#ifdef WISDOM_AMBIENT_OCCLUSION
		#ifdef HQ_AO
		float ao = blurAO(texcoord, land.N);
		#else
		float ao = texture2D(composite, texcoord).r;
		#endif
		amb.attenuation *= ao;
		torch.attenuation *= ao;

		if (mask.is_plant) sun.light.attenuation *= ao;
		#endif

		#ifdef FORCE_GROUND_WETNESS
		// Force ground wetness
		float wetness2 = wetness * smoothstep(0.92, 1.0, mclight.y) * float(!mask.is_plant);
		if (wetness2 > 0.0 && !(mask.is_water || mask.is_hand || mask.is_entity) && BiomeType.y > 0.5) {
			float wet = mix(noise((land.wpos + cameraPosition).xz * 0.5 - frametime * 0.02), 0.5, rainStrength);
			wet += noise((land.wpos + cameraPosition).xz * 0.6 - frametime * 0.01) * 0.5;
			wet += noise((land.wpos + cameraPosition).xz * 1.2 - frametime * 0.01) * 0.5 * rainStrength;
			wet = clamp(wetness2 * 3.0, 0.0, 1.0) * clamp(wet * 2.0 + wetness2, 0.0, 1.0) * smoothstep(0.5, 1.0, BiomeType.y);

			if (wet > 0.0) {
				land.roughness = mix(land.roughness, 0.05, wet);
				land.metalic = mix(land.metalic, 0.03, wet);
				vec3 flat_normal = normalDecode(mclight.zw);
				land.N = mix(land.N, flat_normal, wet);

				land.N.x += noise((land.wpos.xz + cameraPosition.xz) * 5.0 - vec2(frametime * 2.0, 0.0)) * 0.05 * wet;
				land.N.y -= noise((land.wpos.xz + cameraPosition.xz) * 6.0 - vec2(frametime * 2.0, 0.0)) * 0.05 * wet;
				land.N = normalize(land.N);
			}
		}
		#endif

		// Light composite
		color += light_calc_PBR(sun, land, mask.is_plant ? thickness : 1.0) + light_calc_diffuse(torch, land) + light_calc_diffuse(amb, land);
		
		//color += mclight.y * sunLight * 0.006;
		color += texture2D(gaux1, texcoord).rgb * 0.05 * float(mask.is_glass) * pow(dot(suncolor, vec3(0.2066)), 2.0) * (1.0 - shadow);

		// Emmisive
		if (!mask.is_trans) color = mix(color, land.albedo * 2.0, land.emmisive);
	} else {
		vec4 viewPosition = fetch_vpos(texcoord, 1.0);
		vec4 wpos0 = gbufferModelViewInverse * viewPosition;
		vec4 worldPosition = normalize(wpos0) * 512.0;
		worldPosition.y += cameraPosition.y;
		// Sky
		#ifdef SPACE
		color = vec3(0.0);
		#else
		color = calc_sky_with_sun(worldPosition.xyz, normalize(viewPosition.xyz), sunLight, ambientU);
		#endif
		//color = vec3(get_thickness(normalize(worldPosition.xyz)));
	}
	
	//vec4 bufferColor = vec4(thickness, thickness, thickness, 1.0);//texture2D(shadowcolor0, texcoord);//saveTexture(colortex0, 0, texcoord);
	
/* DRAWBUFFERS:3 */
	gl_FragData[0] = vec4(max(vec3(0.0), color), 1.0f);
	//gl_FragData[1] = bufferColor;
}
