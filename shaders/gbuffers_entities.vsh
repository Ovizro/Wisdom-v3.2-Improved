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
#pragma optimize(on)

uniform mat4 gbufferModelViewInverse;

#define NORMALS

attribute vec4 mc_Entity;
attribute vec4 mc_midTexCoord;
attribute vec4 at_tangent;

varying vec4 color;
varying vec3 normal;
varying vec4 coords;

varying vec2 n2;

#define texcoord coords.rg
#define lmcoord coords.ba

#include "gbuffers.inc.vsh"

//vec2 normalEncode(vec3 n) {return sqrt(-n.z*0.125+0.125) * normalize(n.xy) + 0.5;}

#ifdef NORMALS
varying vec3 tangent;
varying vec3 binormal;
#endif

VSH {
	color = gl_Color;
	
	#ifdef NORMALS
	tangent = normalize(gl_NormalMatrix * at_tangent.xyz);
    binormal = cross(normal, tangent);
    #endif
	
	gl_Position = ftransform();
	normal = gl_NormalMatrix * gl_Normal;
	n2 = normalEncode(normal);
	texcoord = (gl_TextureMatrix[0] * gl_MultiTexCoord0).st;
	lmcoord = (gl_TextureMatrix[1] * gl_MultiTexCoord1).xy;
}
