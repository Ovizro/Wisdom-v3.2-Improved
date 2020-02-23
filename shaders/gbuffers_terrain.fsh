/*
 * Copyright 2017 Cheng Cao
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// =============================================================================
//  PLEASE FOLLOW THE LICENSE AND PLEASE DO NOT REMOVE THE LICENSE HEADER
// =============================================================================
//  ANY USE OF THE SHADER ONLINE OR OFFLINE IS CONSIDERED AS INCLUDING THE CODE
//  IF YOU DOWNLOAD THE SHADER, IT MEANS YOU AGREE AND OBSERVE THIS LICENSE
// =============================================================================

#version 120
#include "/lib/compat.glsl"
#pragma optimize(on)

//#define SMOOTH_TEXTURE

#define NORMALS

uniform sampler2D texture;
uniform sampler2D specular;

#ifdef NORMALS
uniform sampler2D normals;
#else
varying vec2 n2;
#endif

varying f16vec4 color;
varying vec4 coords;
varying vec4 wdata;

varying float dis;
varying vec3 wpos;
varying float top;

#define normal wdata.xyz
#define flag wdata.w

#define texcoord coords.rg
#define lmcoord coords.ba

#ifdef NORMALS
varying f16vec3 tangent;
varying f16vec3 binormal;

f16vec2 normalEncode(f16vec3 n) {return sqrt(-n.z*0.125f+0.125f) * normalize(n.xy) + 0.5f;}
#endif

uniform ivec2 atlasSize;
uniform vec3 BiomeType;
uniform float wetness;
uniform vec3 cameraPosition;
uniform float rainStrength;
uniform float frameTimeCounter;
uniform int worldTime;

//#define WorldTimeAnimation

#ifdef WorldTimeAnimation
float frametime = float(worldTime)/20.0;
#else
float frametime = frameTimeCounter;
#endif

float rain0 = rainStrength * smoothstep(0.0, 0.5, BiomeType.y);
//float Bwetness = wetness * smoothstep(0.0, 0.5, BiomeType.y);

#define ParallaxOcclusion
#ifdef ParallaxOcclusion
varying f16vec3 tangentpos;

#define TILE_RESOLUTION 0 // [32 64 128 256 512 1024]

vec2 atlas_offset(in vec2 coord, in vec2 offset) {
	const ivec2 atlasTiles = ivec2(32, 16);
	#if TILE_RESOLUTION == 0
	int tileResolution = atlasSize.x / atlasTiles.x * 2;
	#else
	int tileResolution = TILE_RESOLUTION;
	#endif

	coord *= atlasSize;

	vec2 offsetCoord = coord + mod(offset.xy * atlasSize, vec2(tileResolution));

	vec2 minCoord = vec2(coord.x - mod(coord.x, tileResolution), coord.y - mod(coord.y, tileResolution));
	vec2 maxCoord = minCoord + tileResolution;

	if (offsetCoord.x > maxCoord.x)
		offsetCoord.x -= tileResolution;
	else if (offsetCoord.x < minCoord.x)
		offsetCoord.x += tileResolution;

	if (offsetCoord.y > maxCoord.y)
		offsetCoord.y -= tileResolution;
	else if (offsetCoord.y < minCoord.y)
		offsetCoord.y += tileResolution;

	offsetCoord /= atlasSize;

	return offsetCoord;
}

//#define PARALLAX_SELF_SHADOW
#ifdef PARALLAX_SELF_SHADOW
varying vec3 sun;
float parallax_lit = 1.0;
#endif

vec2 ParallaxMapping(in vec2 coord) {
	vec2 adjusted = coord.st;
	#define maxSteps 8 // [4 8 16]
	#define scale 0.01 // [0.005 0.01 0.02]

	float heightmap = texture2D(normals, coord.st).a - 1.0f;

	vec3 offset = vec3(0.0f, 0.0f, 0.0f);
	vec3 s = tangentpos;//normalize(tangentpos);
	s = s / s.z * scale / maxSteps;

	float lazyx = 0.5;
	const float lazyinc = 0.25 / maxSteps;

	if (heightmap < 0.0f) {
		for (int i = 0; i < maxSteps; i++) {
			float prev = offset.z;
			
			offset += (heightmap - prev) * lazyx * s;
			lazyx += lazyinc;
			
			adjusted = atlas_offset(coord.st, offset.st);
			heightmap = texture2D(normals, adjusted).a - 1.0f;
			if (max(0.0, offset.z - heightmap) < 0.05) break;
		}
		
		#ifdef PARALLAX_SELF_SHADOW
		s = normalize(sun);
		s = s * scale * 10.0 / maxSteps;
		vec3 light_offset = offset;
		
		for (int i = 0; i < maxSteps; i++) {
			float prev = offset.z;
			
			light_offset += s;
			lazyx += lazyinc;
			
			heightmap = texture2D(normals, atlas_offset(coord.st, light_offset.st)).a - 1.0f;
			if (heightmap > light_offset.z) {
				parallax_lit = 0.5;
				break;
			}
		}
		#endif
	}

	return adjusted;
}
#endif

//#define SPECULAR_TO_PBR_CONVERSION
//#define CONTINUUM2_TEXTURE_FORMAT

#define NEW_RAIN_SPLASHES
#define RAIN_SPLASH_LEVEL 1.0 //[0.5 0.6 0.7 0.8 0.9 1.0 1.1 1.2 1.3 1.4 1.5 1.6 1.7 1.8 1.9 2.0]

vec2 getWetness(inout vec4 sp, float height) {
	#ifdef NEW_RAIN_SPLASHES
	float wet0 = BiomeType.x * min(wetness * 4, 1.0) * 3.8 * smoothstep(0.5, 1.0, BiomeType.y) * RAIN_SPLASH_LEVEL;
	float rH = wet0 * plus(sp.r, sp.g) * smoothstep(0.92, 1.0, lmcoord.y) * top;
	float isWater = step(height, rH * 1.2);
	wet0 *= smoothstep(0.8, 1.0, lmcoord.y);
	sp.r = mix(plus(sp.r, wet0 * sp.g * 0.7), 0.95, isWater);
	sp.g = mix(sp.g, 0.03, isWater);
	sp.b = max(sp.b - wet0 * 0.1 - isWater * 0.4, 0.0);
	return vec2(isWater, (wet0 * 0.5 + isWater) * (1.0- plus(sp.g, sp.r)));
	#else
	return vec2(0.0);
	#endif
}

#define RAIN_SPLASH_WAVE

#ifdef RAIN_SPLASH_WAVE
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
#endif

/*vec3 numTest(float x) {
	if (x > 1) return vec3(x, 0.0, 0.0);
	else if (x < 0) return vec3(0.0, 0.0, x);
	else return vec3(x);
}*/

/* DRAWBUFFERS:0245 */
void main() {
	vec2 texcoord_adj = texcoord;
	#ifdef ParallaxOcclusion
	if (dis < 64.0) texcoord_adj = ParallaxMapping(texcoord);
	#endif

	f16vec4 t = texture2D(texture, texcoord_adj);

	#ifdef PARALLAX_SELF_SHADOW
	t.rgb *= parallax_lit;
	#endif

	vec4 sp; vec2 nor2;
	#ifdef SPECULAR_TO_PBR_CONVERSION
	vec3 spec = texture2D(specular, texcoord_adj).rgb;
	float spec_strength = dot(spec, mix(vec3(0.4, 0.4, 0.2), vec3(0.3, 0.6, 0.1), wetness));
	sp = vec4(spec_strength, spec_strength, 0.0, 1.0);
	#else
	#ifdef CONTINUUM2_TEXTURE_FORMAT
	sp = texture2D(specular, texcoord_adj).brga;
	#else
	sp = texture2D(specular, texcoord_adj);
	#endif
	#endif
	#ifdef NORMALS
		vec4 norMap = texture2D(normals, texcoord_adj);
		vec2 wet = getWetness(sp, norMap.w);
		t *= 1.0 - wet.y * 0.4;
		
		vec3 N = normal;
		f16vec3 normal2 = normal;
		if (dis < 64.0) {
			#ifdef RAIN_SPLASH_WAVE
			N.x += noise(wpos.xz * (5.0 + rain0 * 5) - vec2(frametime * 2.0, 0.0)) * 0.04 * wet.x * (1.0 + rain0);
			N.y -= noise(wpos.xz * (5.0 + rain0 * 5) - vec2(frametime * 2.0, 0.0)) * 0.04 * wet.x * (1.0 + rain0);
			#endif
			normal2 = norMap.xyz * 2.0 - 1.0;
			//rainNormal = rainNormal * 2.0 + 1.0;
			const float16_t bumpmult = 0.5;
			normal2 = normal2 * bumpmult + vec3(0.0f, 0.0f, 1.0f - bumpmult);
			//rainNormal = rainNormal * bumpmult + vec3(0.0f, 0.0f, 1.0f - bumpmult);
			
			f16mat3 tbnMatrix = mat3(tangent, binormal, normal);
			normal2 = tbnMatrix * normal2;
		}
		N = normalize(N);//  + vec4(rainNormal
		f16vec2 n2 = normalEncode(N);
		vec2 d = normalEncode(normal2);
		//if (!(d.x > 0.0 && d.y > 0.0)) d = n2;
		nor2 = mix(n2, d, min((1.0 - wet.x), Cselect(d, 0.0, 1.0)));
	#else
		nor2 = n2;
	#endif
	
	gl_FragData[0] = t * color;//vec4(-rainNormal, 1.0);//vec4(numTest(wet.y), 1.0);//
	gl_FragData[1] = vec4(nor2, flag, 1.0);
	gl_FragData[2] = sp;
	gl_FragData[3] = vec4(lmcoord, n2);
}
