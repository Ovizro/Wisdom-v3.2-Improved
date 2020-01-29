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

#if !(defined _INCLUDE_COMPAT)
#define _INCLUDE_COMPAT

#extension GL_ARB_shader_texture_lod : require

// GPU Shader 4
#ifdef MC_GL_EXT_gpu_shader4

#extension GL_EXT_gpu_shader4 : require
#define HIGH_LEVEL_SHADER

#endif

// Half float support
#ifdef MC_GL_AMD_shader_half_float
#extension GL_AMD_shader_half_float : require
#else

	#define float16_t float
	#define f16vec2 vec2
	#define f16vec3 vec3
	#define f16vec4 vec4
	#define f16mat2 mat2
	#define f16mat3 mat3
	#define f16mat4 mat4
	#define HF f

#endif

#define sampler2D_color sampler2D

// GPU Shader 5
#ifdef MC_GL_ARB_gpu_shader5
#extension GL_ARB_gpu_shader5 : require
#else
#define fma(a,b,c) ((a)*(b)+c)
#endif

// Texture gather
#ifdef MC_GL_ARB_texture_gather
#extension GL_ARB_texture_gather : require
#else

#ifndef VIEW_WIDTH
#define VIEW_WIDTH
uniform float viewWidth;                        // viewWidth
uniform float viewHeight;                       // viewHeight
uniform vec2 pixel;
#endif

vec4 textureGather(sampler2D sampler, vec2 coord) {
  vec2 c = coord * vec2(viewWidth, viewHeight);
  c = round(c) * pixel;
  return vec4(
    texture2D(sampler, c + vec2(.0,pixel.y)     ).r,
    texture2D(sampler, c + vec2(pixel.x,pixel.y)).r,
    texture2D(sampler, c + vec2(.0,pixel.y)     ).r,
    texture2D(sampler, c                        ).r
  );
}

vec4 textureGatherOffset(sampler2D sampler, vec2 coord, ivec2 offset) {
  vec2 c = coord * vec2(viewWidth, viewHeight);
  c = (round(c) + vec2(offset)) * pixel;
  return vec4(
    texture2D(sampler, c + vec2(.0,pixel.y)     ).r,
    texture2D(sampler, c + vec2(pixel.x,pixel.y)).r,
    texture2D(sampler, c + vec2(.0,pixel.y)     ).r,
    texture2D(sampler, c                        ).r
  );
}
#endif

#define sum4(x) (dot(vec4(1.0), x))
#define sum3(x) (dot(vec3(1.0), x))
#define sum2(x) (x.x + x.y)

#define plus(m, n) ((m + n) - m * n)
#define select(x, def) float(x == def)
#define Cselect(x, edge0, edge1) float(x == clamp(x, edge0, edge1))

float pow2(float a) { return a*a; }
float pow3(float a) { return (a*a)*a; }

vec2 pow2(vec2 a) { return a*a; }
vec2 pow3(vec2 a) { return (a*a)*a; }

vec3 pow2(vec3 a) { return a*a; }
vec3 pow3(vec3 a) { return (a*a)*a; }

vec4 pow2(vec4 a) { return a*a; }
vec4 pow3(vec4 a) { return (a*a)*a; }

float linearstep(float edge0, float edge1, float x) {
    float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
	return t;
}
#endif