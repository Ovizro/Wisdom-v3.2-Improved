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

uniform sampler2D texture;

varying vec2 texcoord;
varying vec3 color;
varying float LOD;
varying float is_water;
varying vec4 vpos;

//define WATER_CAUSTICSs

#include "/lib/Utilities.glsl.frag"
#include "/lib/Water.glsl.frag"

void main() {
	#ifdef WATER_CAUSTICS
	float caustic = fma(worldLightPosition.y, 0.98, 0.02) * (1.3 - get_caustic(vec3(shadowModelViewInverse * vpos)));
	vec3 wcolor = mix(getWaterFogColor(1.0) * 0.8, suncolor, caustic);
	#else
	vec3 wcolor = getWaterFogColor(1.0) * 0.8;
	#endif
	vec4 scolor = texture2DLod(texture, texcoord, LOD) * vec4(color, 1.0);
	gl_FragData[0] = mix(scolor, vec4(wcolor, 1.0), is_water);
}
