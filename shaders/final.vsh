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

varying vec2 tex;

#define DISTORTION_FIX
#ifdef DISTORTION_FIX
const float strength = 1.0;
const float cylindricalRatio = 1.0;
uniform float aspectRatio;

varying vec3 vUV;
varying vec2 vUVDot;
#endif

#define LENS_FLARE
#ifdef LENS_FLARE
uniform sampler2D depthtex0;
uniform sampler2D colortex1;
#endif

#define ANIMATION 0		//[0 2 3]
// 0 off || 2 eyes open || 3 simple animation

#define _VERTEX_SHADER_

#include "/lib/Utilities.glsl.frag"
#if ANIMATION > 0
#include "/lib/Animation.glsl.frag"
#endif
#ifdef LENS_FLARE
#include "/lib/lensFlare.glsl"
#endif

varying vec2 lf1Pos;
varying vec2 lf2Pos;
varying vec2 lf3Pos;
varying vec2 lf4Pos;

void main() {
	gl_Position = ftransform();
	tex = gl_MultiTexCoord0.st;
	
	calcCommons();
		
	#ifdef DISTORTION_FIX
	float fov = atan(1./gbufferProjection[1][1]);
	if (isEyeInWater == 1) fov *= 0.85;
	float height = tan(fov / aspectRatio * 0.5);
	
	float scaledHeight = strength * height;
	float cylAspectRatio = aspectRatio * cylindricalRatio;
	float aspectDiagSq = aspectRatio * aspectRatio + 1.0;
	float diagSq = scaledHeight * scaledHeight * aspectDiagSq;
	vec2 signedUV = (2.0 * tex + vec2(-1.0, -1.0));
 
	float z = 0.5 * sqrt(diagSq + 1.0) + 0.5;
	float ny = (z - 1.0) / (cylAspectRatio * cylAspectRatio + 1.0);
 
	vUVDot = sqrt(ny) * vec2(cylAspectRatio, 1.0) * signedUV;
	vUV = vec3(0.5, 0.5, 1.0) * z + vec3(-0.5, -0.5, 0.0);
	vUV.xy += tex;
	#endif
	
	#ifdef ANIMATION
	animationCommons();
	#endif
	
	#ifdef LENS_FLARE
	lensFlareCommons();
	#endif
}
