#version 120
#include "/lib/compat.glsl"
#pragma optimize (on)

varying vec2 texcoord;

varying vec3 sunLight;
varying vec3 sunraw;
varying vec3 ambientU;

//varying vec3 N;
//varying vec2 lmcoord;

//varying vec3 wN;
//varying vec3 wT;
//varying vec3 wB;

//#define SPACE

#include "GlslConfig"

#include "/lib/CompositeUniform.glsl.frag"
#include "/lib/Utilities.glsl.frag"
#include "/lib/Material.glsl.frag"
#include "/lib/Lighting.glsl.frag"
#include "/lib/Atmosphere.glsl.frag"

const bool depthtex1MipmapEnabled = true;
const bool compositeMipmapEnabled = true;

vec4 mclight = texture2D(gaux2, texcoord);

#define WaterColor 1 // [0 1 2 3 4 5 6]
//0 Orginal || 1 New || 2 Green || 3 Blue || 4 Blood || 5 Clear || 6 Costom
#define WaterFogColor_R 0.1 //[0.001 0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.85 0.9 0.95 1.0 1.05 1.1 1.15 1.2 1.25 1.3 1.35 1.4 1.45 1.5 1.6 1.7 1.8 1.9 2.0]
#define WaterFogColor_G 0.6 //[0.001 0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.85 0.9 0.95 1.0 1.05 1.1 1.15 1.2 1.25 1.3 1.35 1.4 1.45 1.5 1.6 1.7 1.8 1.9 2.0]
#define WaterFogColor_B 0.8 //[0.001 0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.85 0.9 0.95 1.0 1.05 1.1 1.15 1.2 1.25 1.3 1.35 1.4 1.45 1.5 1.6 1.7 1.8 1.9 2.0]
#define WaterColor_A 0.2 //[0.0 0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.85 0.9 0.95 1.0]
#define DeepWaterFogColor_R 0.1 //[0.001 0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.85 0.9 0.95 1.0 1.05 1.1 1.15 1.2 1.25 1.3 1.35 1.4 1.45 1.5 1.6 1.7 1.8 1.9 2.0]
#define DeepWaterFogColor_G 0.6 //[0.001 0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.85 0.9 0.95 1.0 1.05 1.1 1.15 1.2 1.25 1.3 1.35 1.4 1.45 1.5 1.6 1.7 1.8 1.9 2.0]
#define DeepWaterFogColor_B 0.8 //[0.001 0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.85 0.9 0.95 1.0 1.05 1.1 1.15 1.2 1.25 1.3 1.35 1.4 1.45 1.5 1.6 1.7 1.8 1.9 2.0]
#define DeepWaterFogStrength 0.02 //[0.0 0.01 0.02 0.03 0.04 0.05 0.06 0.07 0.08 0.09 0.1]
#define WaterColorWeight_R 1.0 //[0.001 0.005 0.1 0.2 0.3 0.4 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.83 0.85 0.87 0.9 0.93 0.95 0.96 0.97 0.98 0.99 1.0 1.01 1.02 1.03 1.04 1.05 1.07 1.1 1.13 1.15 1.17 1.2 1.25 1.3 1.35 1.4 1.45 1.5 1.6 1.7 1.8 1.9 2.0 2.5 3.0 3.5 4.0 4.5 5.0 6.0 7.0 8.0 9.0 10.0]
#define WaterColorWeight_G 1.0 //[0.001 0.005 0.1 0.2 0.3 0.4 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.83 0.85 0.87 0.9 0.93 0.95 0.96 0.97 0.98 0.99 1.0 1.01 1.02 1.03 1.04 1.05 1.07 1.1 1.13 1.15 1.17 1.2 1.25 1.3 1.35 1.4 1.45 1.5 1.6 1.7 1.8 1.9 2.0 2.5 3.0 3.5 4.0 4.5 5.0 6.0 7.0 8.0 9.0 10.0]
#define WaterColorWeight_B 1.0 //[0.001 0.005 0.1 0.2 0.3 0.4 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.83 0.85 0.87 0.9 0.93 0.95 0.96 0.97 0.98 0.99 1.0 1.01 1.02 1.03 1.04 1.05 1.07 1.1 1.13 1.15 1.17 1.2 1.25 1.3 1.35 1.4 1.45 1.5 1.6 1.7 1.8 1.9 2.0 2.5 3.0 3.5 4.0 4.5 5.0 6.0 7.0 8.0 9.0 10.0]

#define RayStrength 1.0 //[0.5 0.75 1.0 1.25 1.5 1.75 2.0]
#define FORCE_GROUND_WETNESS
//#define DARK_NIGHT

float waterFogColor0 = select(WaterColor, 0);
float waterFogColor1 = select(WaterColor, 1);
float waterFogColor2 = select(WaterColor, 2);
float waterFogColor3 = select(WaterColor, 3);
float waterFogColor4 = select(WaterColor, 4);
float waterFogColor6 = select(WaterColor, 5);
float waterFogColor5 = select(WaterColor, 6);

float waterA = (WaterFogColor_G + WaterFogColor_B) / (WaterFogColor_R * WaterColorWeight_R + 0.53);
float waterB = (WaterFogColor_R + WaterFogColor_B) / (WaterFogColor_G * WaterColorWeight_G + 0.53);
float waterC = (WaterFogColor_R + WaterFogColor_G) / (WaterFogColor_B * WaterColorWeight_B + 0.53);

Material glossy;
Material land;
LightSourcePBR sun;

Mask mask;

uniform vec3 fogColor;

float sum4_depth_bias(sampler2D buf, sampler2D depth, float cutoff, vec2 uv, ivec2 offset) {
  vec4 c = textureGatherOffset(buf, uv, offset);
  vec4 d = step(cutoff, textureGatherOffset(depth, uv, offset));
  return dot(c, vec4(1.0) - d);
}

#define WATER_PARALLAX

#define ATMOSPHERE_FOG
#define NewCrespecularRays

#include "/lib/Water.glsl.frag"

#define WISDOM_AMBIENT_OCCLUSION
#define WATER_REFRACTION
#define IBL
#define IBL_SSR

//#define GLASS_REFRACTION

void main() {
	// rebuild hybrid flag
	vec4 normaltex = texture2D(gnormal, texcoord);
	vec4 speculardata = texture2D(gaux1, texcoord);
	float flag = speculardata.a;

	// build up mask
	init_mask(mask, flag);

	vec3 color0 = texture2D(composite, texcoord).rgb;
	mclight.x += texture2D(gaux1, texcoord).b;

	//CrespecularRays
	#define VLCWWT
	#define VLCWWT_STRENGTH 0.3 //[0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0]

	#ifdef VLCWWT
	vec4 vlTime = Time;
	#else
	vec4 vlTime = vec4(0.0);
	#endif
	float vl;
	float lit_strength = 1.0;

	vec3 nwpos;

	material_sample(land, texcoord);
	vec3 color = color0;

	float total_internal_reflection = 0.0;

	// Transperant
	if (mask.is_trans || isEyeInWater >= 1 || mask.is_particle) {
		material_sample_water(glossy, texcoord);

		float water_sky_light = 0.0;

		if (mask.is_water) {
			water_sky_light = pow(glossy.albedo.b, 1.0f / 2.2f) * 9.8097;
			mclight.y = mix(water_sky_light, mclight.y, isEyeInWater0);
			//if (isEyeInWater == 0) mclight.y = water_sky_light;
			glossy.albedo = vec3(1.0);
			glossy.roughness = 0.05;
			glossy.metalic = 0.01;

			vec3 water_plain_normal = mat3(gbufferModelViewInverse) * glossy.N;
			water_plain_normal = mix(water_plain_normal, -water_plain_normal, isEyeInWater1);
			//if (isEyeInWater == 1) water_plain_normal = -water_plain_normal;

			float lod = pow(max(water_plain_normal.y, 0.0), 4.0);

			#ifdef WATER_PARALLAX
			vec3 wpos0;
			WaterParallax(wpos0, lod);
			//if (lod > 0.0) WaterParallax(glossy.wpos, lod);
			glossy.wpos = mix(wpos0, glossy.wpos, step(0.0, lod));
			float wave = getwave2(glossy.wpos + cameraPosition, lod);
			#else
			float wave = getwave2(glossy.wpos + cameraPosition, lod);
			vec2 p = glossy.vpos.xy / glossy.vpos.z * wave;
			vec2 wp = length(p) * normalize(glossy.wpos).xz * 0.1;
			glossy.wpos -= vec3(wp.x, 0.0, wp.y);
			#endif

			//vec3 water_normal = (lod > 0.99) ? get_water_normal(glossy.wpos + cameraPosition, wave, lod, water_plain_normal) : water_plain_normal;
			//if (isEyeInWater == 1) water_normal = -water_normal;
			vec3 water_normal = mix(get_water_normal(glossy.wpos + cameraPosition, wave, lod, water_plain_normal), water_plain_normal, step(lod, 0.99));//(lod > 0.99) ?  : ;
			water_normal = mix(water_normal,-water_normal, isEyeInWater1);

			glossy.N = mat3(gbufferModelView) * water_normal;
			glossy.vpos = mix(glossy.vpos, (gbufferModelView * vec4(glossy.wpos, 1.0)).xyz, float(!mask.is_water) * isEyeInWater1);//(!mask.is_water && isEyeInWater == 1) ?  : ;
			//glossy.vpos = (!mask.is_water && isEyeInWater == 1) ? glossy.vpos : (gbufferModelView * vec4(glossy.wpos, 1.0)).xyz;
			glossy.nvpos = normalize(glossy.vpos);

			// Refraction
			#ifdef WATER_REFRACTION
			float l = min(32.0, length(land.vpos - glossy.vpos));
			vec3 refract_vpos = refract(glossy.nvpos, glossy.N, mix(1.00029 / 1.33, 1.33 / 1.00029, isEyeInWater1));
			//vec3 refract_vpos = refract(glossy.nvpos, glossy.N, (isEyeInWater == 1) ? 1.33 / 1.00029 : 1.00029 / 1.33);
			if (refract_vpos != vec3(0.0)) {
				l *= mix((0.2 + max(0.0, dot(glossy.nvpos, glossy.N)) * 0.8), 1.0, isEyeInWater0);
				//if (isEyeInWater == 0) l *= (0.2 + max(0.0, dot(glossy.nvpos, glossy.N)) * 0.8);
				vec2 uv = screen_project(refract_vpos * l + glossy.vpos);
				uv = mix(uv, texcoord, pow(abs(uv - vec2(0.5)) * 2.0, vec2(2.0)));

				land.vpos = fetch_vpos(uv, depthtex1).xyz;
				land.cdepth = length(land.vpos);
				land.nvpos = land.vpos / land.cdepth;
				land.cdepthN = land.cdepth / far;

				color = texture2DLod(composite, uv, 1.0).rgb * 0.7;
				color += texture2DLod(composite, uv, 2.0).rgb * 0.5;
				color += texture2DLod(composite, uv, 3.0).rgb * 0.2;
			} else {
				color = vec3(0.0);
				total_internal_reflection = max(0.0, -dot(glossy.nvpos, glossy.N));
			}
			#endif
			glossy.cdepth = length(glossy.vpos);
			glossy.cdepthN = glossy.cdepth / far;
		} else if (isEyeInWater == 0 && flag < 0.98 && !mask.is_particle) {
			glossy.roughness = 0.3;
			glossy.metalic = 0.8;

			vec2 uv = texcoord;
			#ifdef GLASS_REFRACTION
			if (land.cdepthN < 1.0) {
				vec3 refract_vpos = refract(glossy.nvpos, glossy.N, 1.00029 / 1.52);
				uv = screen_project(refract_vpos + land.vpos - land.nvpos);
				//uv = mix(uv, texcoord, pow(abs(uv - vec2(0.5)) * 2.0, vec2(2.0)));

				land.vpos = fetch_vpos(uv, depthtex1).xyz;
				land.cdepth = length(land.vpos);
				land.nvpos = land.vpos / land.cdepth;
				land.cdepthN = land.cdepth / far;
			}
			#endif

			color = texture2DLod(composite, uv, 0.0).rgb * 0.2;
			color += texture2DLod(composite, uv, 1.0).rgb * 0.3;
			color += texture2DLod(composite, uv, 2.0).rgb * 0.5;

			float n = noise((glossy.wpos.xz + cameraPosition.xz) * 0.06) * 0.05;
			glossy.N.x += n;
			glossy.N.y -= n;
			glossy.N.z += n;
			glossy.N = normalize(glossy.N);

			color = color * glossy.albedo * 2.0;
		} else {
			color = mix(color, glossy.albedo, glossy.opaque * (float(mask.is_sky) * 0.7 + 0.3));
		}

		float shadow = 1.0;
		shadow = mix(light_fetch_shadow_fast(shadowtex1, light_shadow_autobias(land.cdepthN), wpos2shadowpos(glossy.wpos)), shadow, (1.0-isEyeInWater0) * max(0.0, sign(flag - 0.98)));

		// Render
		if (mask.is_water || isEyeInWater == 1) {
			float dist_diff = length(glossy.vpos) * isEyeInWater + distance(land.vpos, glossy.vpos) * (1 - isEyeInWater);
			dist_diff += total_internal_reflection * 4.0;
			float dist_diff_N = min(1.0, dist_diff * 0.0625);

			// Absorption
			float absorption = 2.0 / (dist_diff_N + 1.0) - 1.0;
			vec3 watercolor = color * (pow(vec3(clamp((absorption + (0.22 * waterFogColor6 - 0.32 * waterFogColor4 + 0.43 * (1.0 - max(float(mask.is_water), float(mask.is_sky))))), 0.1, 1.0)), (vec3(2.0, 0.8, 1.0) * (waterFogColor0 + waterFogColor1) + vec3(1.0) * waterFogColor6 + vec3(2.8,0.4,1.6) * waterFogColor2 + vec3(2.4,1.5,0.1) * waterFogColor3 + vec3(0.001,4.2,3.4) * waterFogColor4 + vec3(waterA,waterB,waterC) * 0.1 * waterFogColor5)));

			if (isEyeInWater == 0) {
				float light_att = (max(water_sky_light, 1.0 - shadow) - rainStrength * 0.43 * smoothstep(0.0, 0.5, BiomeType.y));

				vec3 waterfog = max(luma(ambient) * 0.18, 0.0) * light_att * (vec3(0.1,0.6,0.8) * waterFogColor0 + vec3(0.05,0.6,1.0) * waterFogColor1 + vec3(0.1,1.0,0.5) * waterFogColor2 + vec3(0.005,0.3,1.2) * waterFogColor3 + vec3(0.8,0.015,0.03) * waterFogColor4 * 0.73 + vec3(0.03, 0.15, 0.4) * waterFogColor6 + vec3(WaterFogColor_R,WaterFogColor_G,WaterFogColor_B) * waterFogColor5);

				color = mix(waterfog , watercolor, clamp((pow(absorption, 2.0) * (1.0 * waterFogColor0 + 1.0 * (waterFogColor1 + waterFogColor2 + waterFogColor3 + waterFogColor5) + 1.2 * waterFogColor4) + (-0.35 * waterFogColor4 + 0.38 * waterFogColor6 + WaterColor_A * waterFogColor5 * 0.1)), 0.1, 0.92));
			} else {
				float light_att = (eyeBrightness.y * 0.0215 * (total_internal_reflection + 1.0) - rainStrength * 0.3 * smoothstep(0.0, 0.5, BiomeType.y));

				vec3 waterfog = mix((vec3(0.0015,0.025,0.05) * waterFogColor1 + vec3(0.0015,0.02,0.03) * (waterFogColor2 + waterFogColor6) + vec3(0.0005,0.001,0.07) * waterFogColor3 + vec3(0.05,0.0023,0.006) * waterFogColor4 + vec3(DeepWaterFogColor_R, DeepWaterFogColor_G, DeepWaterFogColor_B) * waterFogColor5 * DeepWaterFogStrength) * 0.4,(vec3(0.1,0.6,0.8) * waterFogColor0 + vec3(0.05,0.6,1.0) * waterFogColor1 + vec3(0.1,1.0,0.5) * waterFogColor2 + vec3(0.005,0.3,1.2) * waterFogColor3 + vec3(0.8,0.015,0.03) * waterFogColor4 * 0.73 + vec3(0.03, 0.15, 0.4) * waterFogColor6 + vec3(WaterFogColor_R,WaterFogColor_G,WaterFogColor_B) * waterFogColor5),clamp((max(luma(ambient) * 0.18, 0.0) * light_att - 0.05), 0.0, 1.0));

				color = mix(waterfog , watercolor, clamp((pow(absorption, 2.0) + (0.52 * (waterFogColor1 + waterFogColor3) + 0.32 * waterFogColor2 - 0.45 * waterFogColor4 + WaterColor_A * waterFogColor5) + 0.62 * waterFogColor6), 0.1, 0.92));
				}
		}else if(isEyeInWater == 2) {
			vec3 lavaFog = vec3(0.9, 0.2, 0.1);
			color = mix(color, lavaFog, 0.2);
		}

		#ifndef SPACE
		if (isEyeInWater == 0 && (flag < 0.98 || mask.is_sky)) {
			sun.light.color = suncolor;
			shadow = max(extShadow, shadow);
			sun.light.attenuation = 1.0 - shadow;
			sun.L = lightPosition;

			color += light_calc_PBR_brdf(sun, glossy);

			land = glossy;
		}
		#endif

		if (isEyeInWater == 1 && total_internal_reflection > 0.0) land = glossy;
	} else {
		#ifdef FORCE_GROUND_WETNESS
		// Force ground wetness
		float wetness2 = wetness * smoothstep(0.92, 1.0, mclight.y) * float(!mask.is_plant);
		if (wetness2 > 0.0 && !(mask.is_water || mask.is_hand || mask.is_entity) && BiomeType.y > 0.5) {
			float wet = mix(noise((land.wpos + cameraPosition).xz * 0.5 - frametime * 0.02), 0.5, rainStrength);
			wet += noise((land.wpos + cameraPosition).xz * 0.6 - frametime * 0.01) * 0.5;
			wet += noise((land.wpos + cameraPosition).xz * 1.2 - frametime * 0.01) * 0.5 * rainStrength;
			//wet -= noise((land.wpos + cameraPosition).xz * 0.08 - frametime * 0.01) * 0.5 * rainStrength;
			//wet += noise((land.wpos + cameraPosition).xz * 0.05 - frametime * 0.01 + 1.0) * 0.5 * rainStrength;
			//wet += noise((land.wpos + cameraPosition).xz * 0.3 - frametime * 0.01) * 0.5 * rainStrength;
			wet = clamp(wetness2 * 3.0, 0.0, 1.0) * clamp(wet * 2.0 + wetness2, 0.0, 1.0) * smoothstep(0.5, 1.0, BiomeType.y);

			if (wet > 0.0) {
				land.roughness = mix(land.roughness, 0.05, wet);
				land.metalic = mix(land.metalic, 0.03, wet);
				if (mclight.w > 0.5) {
					vec3 flat_normal = normalDecode(mclight.zw);
					land.N = mix(land.N, flat_normal, wet);
				}

				color *= 1.0 - wet * 0.6;

				land.N.x += noise((land.wpos.xz + cameraPosition.xz) * 5.0 - vec2(frametime *2.0, 0.0)) * 0.05 * wet;
				land.N.y -= noise((land.wpos.xz + cameraPosition.xz) * 6.0 - vec2(frametime * 2.0, 0.0)) * 0.05 * wet;
				land.N = normalize(land.N);

				color = mix(color, color * 0.3, wet * (1.0 - abs(dot(land.nvpos, land.N))));
			}
		}
		#endif
	}

	#ifdef IBL
	// IBL
	if (land.roughness < 0.9) {
		vec3 viewRef = reflect(land.nvpos, land.N);
		#ifdef IBL_SSR
		vec4 glossy_reflect = ray_trace_ssr(viewRef, land.vpos, land.roughness);
		vec3 skyReflect = vec3(0.0);
		if (isEyeInWater == 0 && glossy_reflect.a < 0.95) skyReflect = calc_sky((mat3(gbufferModelViewInverse) * viewRef) * 512.0 + vec3(0.0, cameraPosition.y + land.wpos.y, 0.0), viewRef, cameraPosition + land.wpos.xyz, sunLight*(1.0-Time.w*0.5));
		vec3 ibl = mix(skyReflect * smoothstep(0.0, 0.5, mclight.y), glossy_reflect.rgb, glossy_reflect.a);
		#else
		vec3 ibl = (isEyeInWater == 1) ? vec3(0.0) : calc_sky((mat3(gbufferModelViewInverse) * viewRef) * 512.0, viewRef, cameraPosition + land.wpos.xyz, sunLight*(1.0-Time.w*0.5));
		#endif
		vec3 calc_IBL = light_calc_PBR_IBL(viewRef, land, ibl);
		if (isEyeInWater == 1) calc_IBL *= total_internal_reflection;
		color += calc_IBL;
	}
	#endif

	// Atmosphere
	#ifndef SPACE
	vec3 atmosphere = calc_atmosphere(land.wpos, land.nvpos);
	nwpos = normalize(land.wpos);
	#if CrespecularRays >= 1
	if (isEyeInWater == 0) {
		lit_strength = VL(land.wpos, vl);
	#ifdef NewCrespecularRays
		color += 3.828 * vl * (scatter(vec3(0., 2e3 + cameraPosition.y, 0.), nwpos, worldLightPosition, 84e3)) * (1.0 + (vlTime.y * 0.2 + vlTime.w * 1.42) * VLCWWT_STRENGTH * 3.0) * RayStrength * (1.0 - rain0);
	#else
		color += 0.02204 * pow(vl, 0.52) * suncolor * (1.0 + (vlTime.x * 1.36 + vlTime.z - vlTime.w *0.8 - vlTime.y * 0.2) * VLCWWT_STRENGTH) * (RayStrength - float(mask.is_water) * 0.5);
	#endif
	}
	#endif
		
	#ifdef ATMOSPHERE_FOG
	if (isEyeInWater == 0) calc_fog_height (land, 0.0, 512.0 * (1.0 - cloud_coverage), color, atmosphere * (0.07 * lit_strength + 0.3));
	#endif
	#endif
	
	DoDarkEye(color);
	#ifdef DARK_NIGHT
	DoNightEye(color);
	#endif

	#ifdef XLLLLL
	color=vec3(1.0,0.0,0.0);
	#endif
	
	color = mix(color0, color, max(float(mask.is_valid),isEyeInWater0));

/* DRAWBUFFERS:3 */
	gl_FragData[0] = vec4(color, 1.0f);
}
