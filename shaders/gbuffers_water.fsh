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

//#include "CompositeUniform.glsl.frag"

uniform sampler2D tex;

varying vec2 normal;
varying vec4 coords;

#define WaterColor 1 // [0 1 2 3 4 5 6] 
//0 Orginal || 1 New || 2 Green || 3 Blue || 4 Blood || 5 Clear || 6 Costom
#define WaterFogColor_R 0.1 //[0.001 0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.85 0.9 0.95 1.0 1.05 1.1 1.15 1.2 1.25 1.3 1.35 1.4 1.45 1.5 1.6 1.7 1.8 1.9 2.0]
#define WaterFogColor_G 0.6 //[0.001 0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.85 0.9 0.95 1.0 1.05 1.1 1.15 1.2 1.25 1.3 1.35 1.4 1.45 1.5 1.6 1.7 1.8 1.9 2.0]
#define WaterFogColor_B 0.8 //[0.001 0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.85 0.9 0.95 1.0 1.05 1.1 1.15 1.2 1.25 1.3 1.35 1.4 1.45 1.5 1.6 1.7 1.8 1.9 2.0]
#define WaterColorWeight_R 1.0 //[0.001 0.005 0.1 0.2 0.3 0.4 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.83 0.85 0.87 0.9 0.93 0.95 0.96 0.97 0.98 0.99 1.0 1.01 1.02 1.03 1.04 1.05 1.07 1.1 1.13 1.15 1.17 1.2 1.25 1.3 1.35 1.4 1.45 1.5 1.6 1.7 1.8 1.9 2.0 2.5 3.0 3.5 4.0 4.5 5.0 6.0 7.0 8.0 9.0 10.0]
#define WaterColorWeight_G 1.0 //[0.001 0.005 0.1 0.2 0.3 0.4 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.83 0.85 0.87 0.9 0.93 0.95 0.96 0.97 0.98 0.99 1.0 1.01 1.02 1.03 1.04 1.05 1.07 1.1 1.13 1.15 1.17 1.2 1.25 1.3 1.35 1.4 1.45 1.5 1.6 1.7 1.8 1.9 2.0 2.5 3.0 3.5 4.0 4.5 5.0 6.0 7.0 8.0 9.0 10.0]
#define WaterColorWeight_B 1.0 //[0.001 0.005 0.1 0.2 0.3 0.4 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.83 0.85 0.87 0.9 0.93 0.95 0.96 0.97 0.98 0.99 1.0 1.01 1.02 1.03 1.04 1.05 1.07 1.1 1.13 1.15 1.17 1.2 1.25 1.3 1.35 1.4 1.45 1.5 1.6 1.7 1.8 1.9 2.0 2.5 3.0 3.5 4.0 4.5 5.0 6.0 7.0 8.0 9.0 10.0]

float waterFogColor = float(WaterColor);
float waterFogColor0 = 1.0 - clamp(waterFogColor,0.0,1.0);
float waterFogColor1 = 1.0 - abs(sign(waterFogColor - 1.0));
float waterFogColor2 = 1.0 - abs(sign(waterFogColor - 2.0));
float waterFogColor3 = 1.0 - abs(sign(waterFogColor - 3.0));
float waterFogColor4 = 1.0 - abs(sign(waterFogColor - 4.0));
float waterFogColor6 = 1.0 - abs(sign(waterFogColor - 5.0));
float waterFogColor5 = 1.0 - abs(sign(waterFogColor - 6.0));

#define texcoord coords.rg
#define skyLight coords.b
#define iswater coords.a

/* DRAWBUFFERS:71 */
void main() {

	vec4 color = vec4(0.0);
	if (iswater > 0.78f && iswater < 0.8f)
		color = vec4((vec3(0.0537,0.3562,0.5097) * (waterFogColor0 + waterFogColor6) + vec3(0.0256,0.3562,0.6052) * waterFogColor1 + vec3(0.0537,0.6052,0.3861) * waterFogColor2 + vec3(0.00231,0.1683,0.6052) * waterFogColor3 + vec3(0.5097,0.0076,0.268) * waterFogColor4 + vec3(WaterFogColor_R * WaterColorWeight_R * 0.56,WaterFogColor_G * WaterColorWeight_G * 0.56,WaterFogColor_B * WaterColorWeight_B * 0.52 + 0.172) * waterFogColor5) * skyLight * 0.2, 1.0);
	else
		color = texture2D(tex, texcoord);
	
	gl_FragData[0] = color;
	gl_FragData[1] = vec4(normal, iswater, 1.0);
}
