#version 120
#include "/lib/compat.glsl"
#pragma optimize (on)

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

varying vec2 texcoord;

varying vec3 sunLight;
varying vec3 sunraw;

#define _VERTEX_SHADER_
#include "/lib/Utilities.glsl.frag"
#include "/lib/Atmosphere.glsl.frag"

#define CLOUDS 3 //[1 2 3]

void main() {
	gl_Position = ftransform();
	texcoord = gl_MultiTexCoord0.st;
	
	#if CLOUDS >= 2
	calcCommons();
	
	//worldLightPosition = sunVector;
	float f = pow(max(abs(sunVector.y), 0.0), 1.5);
	sunraw = scatter(vec3(0., 25e2, 0.), worldLightPosition, worldLightPosition, Ra) * (1.0 - cloud_coverage1 * 0.9) + vec3(0.003, 0.005, 0.009) * max(0.0, -worldLightPosition.y) * (1.0 - cloud_coverage1 * 0.8);
	sunLight = (sunraw) * f;
	#endif
}
