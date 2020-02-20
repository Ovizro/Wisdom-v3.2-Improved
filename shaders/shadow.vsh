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

#define SHADOW_MAP_BIAS 0.85f
const float negBias = 1.0f - SHADOW_MAP_BIAS;

attribute vec4 mc_Entity;
attribute vec4 mc_midTexCoord;
attribute vec4 at_tangent;

#define _VERTEX_SHADER_
#include "/lib/Utilities.glsl.frag"

varying vec2 texcoord;
varying vec3 color;
varying float LOD;
varying float is_water;
varying vec4 vpos;

//uniform mat4 shadowProjection;

#define hash(p) fract(mod(p.x, 1.0) * 73758.23f - p.y)

#define WAVING_SHADOW

#define WAVING_LEAVE
#define WAVING_GRASS
#define WAVING_CROP
#define WAVING_VINE
#define WAVING_FLOWERS
#define WAVING_LILY
#define WAVING_TALL_GRASS
//#define WAVING_SAPLINGS

//#define WAVING_SEA_GRASS
//#define WAVING_CORALS

void main() {
	gl_Position = ftransform();
	vpos = gl_ModelViewMatrix * gl_Vertex;
	
	//mat4 gMVP = gl_ProjectionMatrix * gl_ModelViewMatrix;
	//mat4 igMVP = inverse(gMVP);
	mat4 sMVP = shadowProjection * shadowModelView;
	mat4 isMVP = shadowModelViewInverse * shadowProjectionInverse;
	
	vec4 position = isMVP * gl_Position;
	//position = shadowProjectionInverse * position;
	//position = shadowModelViewInverse * position;
	position.xyz += cameraPosition.xyz;
	
	color = gl_Color.rgb;
	calcCommons();

	f16vec3 tangent = normalize(gl_NormalMatrix * at_tangent.xyz);
	
	vec2 waveType = vec2(5.0, 0.0);
	float blockId = mc_Entity.x;
	
	waveType.x -= (select(blockId, 18.0) + select(blockId, 38.0) + select(blockId, 175.0) + select(blockId, 176.0) + select(blockId, 31.0) + select(blockId, 111.0) + select(blockId, 59.0) + select(blockId, 106.0) + select(blockId, 83.0) + select(blockId, 39.0) + select(blockId, 40.0) + select(blockId, 6.0) + select(blockId, 104.0) + select(blockId, 105.0) + select(blockId, 115.0) + select(blockId, 1000.0) + select(blockId, 1001.0) + select(blockId, 1002.0) + select(blockId, 1003.0)) * 5.0;

	#ifdef WAVING_LEAVE
	waveType.x += select(blockId, 18.0) * 2.0;
	#endif
	#ifdef WAVING_FLOWERS
	waveType.x += select(blockId, 38.0);
	#endif
	#ifdef WAVING_TALL_GRASS
	waveType.x += select(blockId, 175.0) * 2.0 + select(blockId, 176.0) * 2.0;
	#endif
	#ifdef WAVING_GRASS
	waveType.x += select(blockId, 31.0);
	#endif
	#ifdef WAVING_LILY
	waveType.x += select(blockId, 111.0) * 2.0;
	#endif
	#ifdef WAVING_CROP
	waveType.x += select(blockId, 59.0);
	#endif
	#ifdef WAVING_VINE
	waveType.x += select(blockId, 106.0) * 2.0;
	#endif
	#ifdef WAVING_SAPLINGS
	waveType.x += (select(blockId, 83.0) + select(blockId, 39.0) + select(blockId, 40.0) + select(blockId, 6.0) + select(blockId, 104.0) + select(blockId, 105.0) + select(blockId, 115.0)) * 2.0;
	#endif
	
	//waveType.y += (select(blockId, 1000.0) + select(blockId, 1001.0)) * 0.65;
	//waveType.y += select(blockId, 1002.0) * 0.531 + select(blockId, 1003.0) * 0.52;
	#ifdef WAVING_SEA_GRASS
	waveType.x += select(blockId, 1000.0) * 2.0 + select(blockId, 1001.0);
	#endif
	#ifdef WAVING_CORALS
	waveType.x += select(blockId, 1002.0) * 2.0;
	#endif
	
	//flag = 0.7;

	#ifdef WAVING_SHADOW
	float maxStrength = 1.0 + rainStrength * 0.5;
	float time = frametime * 3.0;
	#endif

	#ifdef WAVING_SHADOW
	if (waveType.x == 1.0) {
		if (gl_MultiTexCoord0.t < mc_midTexCoord.t) {
			float rand_ang = hash(position.xz);
			float reset = cos(rand_ang * 10.0 + time * 0.1);
			reset = max( reset * reset, max(rainStrength, 0.1));
			position.x += (sin(rand_ang * 10.0 + time + position.y) * 0.2) * (reset * maxStrength);
		}
		//color.a *= 0.4;
		//flag = max(0.50, waveType.y);
	} else if (waveType.x == 2.0) {
		float rand_ang = hash(position.xz);
		float reset = cos(rand_ang * 10.0 + time * 0.1);
		reset = max( reset * reset, max(rainStrength, 0.1));
		position.xyz += (sin(rand_ang * 5.0 + time + position.y) * 0.035 + 0.035) * (reset * maxStrength) * tangent;
		//flag = max(0.50, waveType.y);
	}
	//wpos = vec3((igMVP * sMVP) * position);
	position.xyz -= cameraPosition;
	position = sMVP * position;
	#else
	wpos = gl_Vertex;
	position = ftransform();
	#endif
	
	/*if (gl_MultiTexCoord0.t < mc_midTexCoord.t && (blockId == 31.0 || blockId == 37.0 || blockId == 38.0)) {
		float rand_ang = hash(position.xz);
		float maxStrength = 1.0 + rainStrength * 0.5;
		float time = frametime * 3.0;
		float reset = cos(rand_ang * 10.0 + time * 0.1);
		reset = max( reset * reset, max(rainStrength, 0.1));
		position.x += (sin(rand_ang * 10.0 + time + position.y) * 0.2) * (reset * maxStrength);
	}*/
	
	float l = sqrt(dot(position.xy, position.xy));

//	vec4 testpos = shadowProjection * (gbufferModelViewInverse * vec4(0.0, 0.0, 1.0, 1.0));
//	if (dot(normalize(testpos.xy), normalize(position.xy)) < -0.3) position.z -= 1000000.0f;

	position.xy /= l * SHADOW_MAP_BIAS + negBias;
	
	LOD = l * 2.0;
	if ((blockId == 31.0 || blockId == 37.0 || blockId == 38.0) && l > 0.5) position.z -= 1000000.0f;
	is_water = max(select(blockId, 8) + select(blockId, 9), select(mc_Entity.y, 1));

	gl_Position = position;
	texcoord = gl_MultiTexCoord0.st;
	
}
