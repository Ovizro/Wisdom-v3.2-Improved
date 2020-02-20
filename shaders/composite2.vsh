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
varying vec3 ambientU;

#define LIGHT_COLOR_TEMPERATURE 2500 //[1000 1250 1500 1750 2000 2250 2500 2750 3000 3250 3500 3750 4000 4250 4500 4750 5000 5250 5500 5750 6000 6250 6500 6750 7000 7250 7500 7750 8000 8250 8500 8750 9000]
#define LIGHT_LEVEL 0.2 //[0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.85 0.9 0.95 1.0]

#define _VERTEX_SHADER_
#include "/lib/Utilities.glsl.frag"
#include "/lib/Atmosphere.glsl.frag"

//attribute vec4 mc_Entity;

varying vec3 torch_color;

void main() {
	gl_Position = ftransform();
	texcoord = gl_MultiTexCoord0.st;
	calcCommons();
	
	//worldLightPosition = sunVector;
	float f = pow(max(abs(sunVector.y), 0.0), 1.5);
	sunraw = scatter(vec3(0., 25e2, 0.), worldLightPosition, worldLightPosition, Ra) * (1.0 - cloud_coverage1 * 0.9) + vec3(0.003, 0.005, 0.009) * max(0.0, -worldLightPosition.y) * (1.0 - cloud_coverage1 * 0.8);
	sunLight = (sunraw) * f;
	
	ambientU = scatter(vec3(0., 25e2, 0.), vec3( 0.0,  1.0,  0.0), worldLightPosition, Ra) * 0.8;
	
	torch_color = getLightColor(LIGHT_COLOR_TEMPERATURE * 1.0) * LIGHT_LEVEL * 0.02;
	
}
