#if !(defined _INCLUDE_LENSFLARE)
#define _INCLUDE_LENSFLARE

//#define LF
#define BSL_LENS_FLARE

varying float sunVisibility;
varying float moonVisibility;

#ifdef LF
varying vec2 lf1Pos;
varying vec2 lf2Pos;
varying vec2 lf3Pos;
varying vec2 lf4Pos;
#endif

#ifdef _VERTEX_SHADER_

/*
 *==============================================================================
 *------------------------------------------------------------------------------
 *
 * 								~Vertex stuff~
 *
 *------------------------------------------------------------------------------
 *==============================================================================
 */

#define LF1POS -0.2 //[-0.5 -0.4 -0.3 -0.2 -0.1 0.0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0]
#define LF2POS 0.5 //[-0.5 -0.4 -0.3 -0.2 -0.1 0.0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0]
#define LF3POS 0.7 //[-0.5 -0.4 -0.3 -0.2 -0.1 0.0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0]
#define LF4POS 0.3 //[-0.5 -0.4 -0.3 -0.2 -0.1 0.0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0]

void lensFlareCommons() {
	vec4 ndcLightPosition = gbufferProjection * vec4(normalize(shadowLightPosition), 1.0);
	ndcLightPosition /= ndcLightPosition.w;
	
	sunVisibility = 0.0f;
	moonVisibility = 0.0f;
	
	vec2 screenLightPosition = vec2(-10.0);
	
	if((ndcLightPosition.x >= -1.0 && ndcLightPosition.x <= 1.0 &&
		ndcLightPosition.y >= -1.0 && ndcLightPosition.y <= 1.0 &&
		ndcLightPosition.z >= -1.0 && ndcLightPosition.z <= 1.0)) {
		screenLightPosition = ndcLightPosition.xy * 0.5 + 0.5;
		
		for(int x = -4; x <= 4; x++) {
			for(int y = -4; y <= 4; y++) {
				float depth = texture2DLod(depthtex0, screenLightPosition.st + vec2(float(x), float(y)) * pixel, 0.0).r;
				sunVisibility += float(depth > 0.9999) / 81.0;
				//moonVisibility += float(depth > 0.9999) / 81.0;
			}
		}
		float shortestDis = min( min(screenLightPosition.s, 1.0 - screenLightPosition.s),
								 min(screenLightPosition.t, 1.0 - screenLightPosition.t));
		float cloud = texture2D(colortex1, screenLightPosition).a;
		sunVisibility *= smoothstep(0.0, 0.2, clamp(shortestDis, 0.0, 0.2)) * (1.0 - cloud);
		//moonVisibility *= smoothstep(0.0, 0.2, clamp(shortestDis, 0.0, 0.2)) * (1.0 - cloud1);
		
		moonVisibility = sunVisibility * min(Time.w, (1.0 - rain0));
		sunVisibility *= (1.0 - max(Time.w, rain0));
		//moonVisibility *= min(Time.w, (1.0 - rain0));
		
	#ifdef LF
	lf1Pos = lf2Pos = lf3Pos = lf4Pos = vec2(-10.0);
    vec2 dir = vec2(0.5) - screenLightPosition;
	lf1Pos = vec2(0.5) + dir * LF1POS;
	lf2Pos = vec2(0.5) + dir * LF2POS;
	lf3Pos = vec2(0.5) + dir * LF3POS;
	lf4Pos = vec2(0.5) + dir * LF4POS;
	#endif
	}
}

#else

/*
 *==============================================================================
 *------------------------------------------------------------------------------
 *
 * 								~Fragment stuff~
 *
 *------------------------------------------------------------------------------
 *==============================================================================
 */
 
#define MAX_COLOR_RANGE 32.0

#define LF1
#define LF_COLOR_R1 1.0 //[0.0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0]
#define LF_COLOR_G1 1.0 //[0.0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0]
#define LF_COLOR_B1 1.0 //[0.0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0]
#define LF_COLOR_A1 0.45 //[0.0 0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.85 0.9 0.95 1.0]
#define LF1SIZE 0.021 //[0.001 0.002 0.003 0.004 0.005 0.006 0.007 0.008 0.009 0.01 0.011 0.012 0.013 0.014 0.015 0.016 0.017 0.018 0.019 0.02 0.021 0.022 0.023 0.024 0.025 0.026 0.027 0.028 0.029 0.03 0.031 0.032 0.033 0.034 0.035 0.036 0.037 0.038 0.039 0.04 0.041 0.042 0.043 0.044 0.045 0.046 0.047 0.048 0.049 0.05 0.051 0.052 0.053 0.054 0.055 0.056 0.057 0.058 0.059 0.06]
#define LF2
#define LF_COLOR_R2 1.0 //[0.0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0]
#define LF_COLOR_G2 0.6 //[0.0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0]
#define LF_COLOR_B2 0.4 //[0.0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0]
#define LF_COLOR_A2 0.3 //[0.0 0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.85 0.9 0.95 1.0]
#define LF2SIZE 0.03 //[0.001 0.002 0.003 0.004 0.005 0.006 0.007 0.008 0.009 0.01 0.011 0.012 0.013 0.014 0.015 0.016 0.017 0.018 0.019 0.02 0.021 0.022 0.023 0.024 0.025 0.026 0.027 0.028 0.029 0.03 0.031 0.032 0.033 0.034 0.035 0.036 0.037 0.038 0.039 0.04 0.041 0.042 0.043 0.044 0.045 0.046 0.047 0.048 0.049 0.05 0.051 0.052 0.053 0.054 0.055 0.056 0.057 0.058 0.059 0.06]
#define LF3
#define LF_COLOR_R3 0.2 //[0.0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0]
#define LF_COLOR_G3 0.6 //[0.0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0]
#define LF_COLOR_B3 0.8 //[0.0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0]
#define LF_COLOR_A3 0.5 //[0.0 0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.85 0.9 0.95 1.0]
#define LF3SIZE 0.05 //[0.001 0.002 0.003 0.004 0.005 0.006 0.007 0.008 0.009 0.01 0.011 0.012 0.013 0.014 0.015 0.016 0.017 0.018 0.019 0.02 0.021 0.022 0.023 0.024 0.025 0.026 0.027 0.028 0.029 0.03 0.031 0.032 0.033 0.034 0.035 0.036 0.037 0.038 0.039 0.04 0.041 0.042 0.043 0.044 0.045 0.046 0.047 0.048 0.049 0.05 0.051 0.052 0.053 0.054 0.055 0.056 0.057 0.058 0.059 0.06]
//#define LF4
#define LF_COLOR_R4 0.2 //[0.0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0]
#define LF_COLOR_G4 0.3 //[0.0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0]
#define LF_COLOR_B4 0.9 //[0.0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0]
#define LF_COLOR_A4 0.5 //[0.0 0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5 0.55 0.6 0.65 0.7 0.75 0.8 0.85 0.9 0.95 1.0]
#define LF4SIZE 0.016 //[0.001 0.002 0.003 0.004 0.005 0.006 0.007 0.008 0.009 0.01 0.011 0.012 0.013 0.014 0.015 0.016 0.017 0.018 0.019 0.02 0.021 0.022 0.023 0.024 0.025 0.026 0.027 0.028 0.029 0.03 0.031 0.032 0.033 0.034 0.035 0.036 0.037 0.038 0.039 0.04 0.041 0.042 0.043 0.044 0.045 0.046 0.047 0.048 0.049 0.05 0.051 0.052 0.053 0.054 0.055 0.056 0.057 0.058 0.059 0.06]

#ifdef LF
// =========== LF ===========

#define MANHATTAN_DISTANCE(DELTA) abs(DELTA.x)+abs(DELTA.y)

#define LENS_FLARE(COLOR, UV, LFPOS, LFSIZE, LFCOLOR) { \
				vec2 delta = UV - LFPOS; delta.x *= aspectRatio; \
				if(MANHATTAN_DISTANCE(delta) < LFSIZE * 2.0) { \
					float d = max(LFSIZE - length(delta), 0.0); \
					COLOR += LFCOLOR.rgb * LFCOLOR.a * smoothstep(0.0, LFSIZE * 0.25, d) * sunVisibility;\
				} }

    vec4 LF1COLOR = vec4(LF_COLOR_R1, LF_COLOR_G1, LF_COLOR_B1, LF_COLOR_A1 * 0.1);
    vec4 LF2COLOR = vec4(LF_COLOR_R2, LF_COLOR_G2, LF_COLOR_B2, LF_COLOR_A2 * 0.1);
    vec4 LF3COLOR = vec4(LF_COLOR_R3, LF_COLOR_G3, LF_COLOR_B3, LF_COLOR_A3 * 0.1);
	vec4 LF4COLOR = vec4(LF_COLOR_R4, LF_COLOR_G4, LF_COLOR_B4, LF_COLOR_A4 * 0.1);

vec3 lensFlare(vec3 color, vec2 uv) {
	if(sunVisibility <= 0.0)
		return color;
	#ifdef LF1
	LENS_FLARE(color, uv, lf1Pos, LF1SIZE, (LF1COLOR * vec4(suncolor, 1.0) * (1.0 - extShadow)));
	#endif
	#ifdef LF2
	LENS_FLARE(color, uv, lf2Pos, LF2SIZE, (LF2COLOR * vec4(suncolor, 1.0) * (1.0 - extShadow)));
	#endif
	#ifdef LF3
	LENS_FLARE(color, uv, lf3Pos, LF3SIZE, (LF3COLOR * vec4(suncolor, 1.0) * (1.0 - extShadow)));
	#endif
	#ifdef LF4
	LENS_FLARE(color, uv, lf4Pos, LF4SIZE, (LF4COLOR * vec4(suncolor, 1.0) * (1.0 - extShadow)));
	#endif
	return color;
}
#endif

#ifdef BSL_LENS_FLARE
vec3 light_n = suncolor * Time.w;

vec2 getRefract(vec2 coord){
vec2 refract = vec2(cos(texcoord.y*32.0+frametime*4.0),sin(texcoord.x*32.0+frametime*4.0))*0.001;

vec2 newcoord = coord + refract*isEyeInWater;
float limit = float(newcoord.x < 0.0 || newcoord.x > 1.0 || newcoord.y < 0.0 || newcoord.y > 1.0);

return mix(newcoord,coord,limit);
}

vec3 BSLReinhard(vec3 color){
	vec3 x = color*4.0;
	x = x/(1.0+x);
	#ifndef Tonemap_Scale
	x *= 1.25;
	#endif
	return pow(x,vec3(Tonemap_Curve));
}

float getnoise(vec2 pos) {
return abs(fract(sin(dot(pos ,vec2(18.9898f,28.633f)+pos*100.0)) * 4378.5453f));
}

float genLens(vec2 lightPos, float size, float dist,float rough){
	return pow(clamp(max(1.0-length((texcoord.xy+(lightPos.xy*dist-0.5))*vec2(aspectRatio,1.0)/size),0.0),0.0,1.0/rough)*rough,4.0);
}

float genMultLens(vec2 lightPos, float size, float dista, float distb){
	return genLens(lightPos,size,dista,2)*genLens(lightPos,size,distb,2);
}

float genPointLens(vec2 lightPos, float size, float dist, float sstr){
	return genLens(lightPos,size,dist,1.5)+genLens(lightPos,size*4.0,dist,1)*sstr;
}

float distratio(vec2 pos, vec2 pos2, float ratio) {
	float xvect = pos.x*ratio-pos2.x*ratio;
	float yvect = pos.y-pos2.y;
	return sqrt(xvect*xvect + yvect*yvect);
}

float circleDist (vec2 lightPos, float dist, float size) {

	vec2 pos = lightPos.xy*dist+0.5;
	return pow(min(distratio(pos.xy, texcoord.xy, aspectRatio),size)/size,10.);
}

float genRingLens(vec2 lightPos, float size, float dista, float distb){
	float lensFlare1 = max(pow(max(1.0 - circleDist(lightPos,-dista, size),0.1),5.0)-0.1,0.0);
	float lensFlare2 = max(pow(max(1.0 - circleDist(lightPos,-distb, size),0.1),5.0)-0.1,0.0);

	float lensFlare = pow(clamp(lensFlare2 - lensFlare1, 0.0, 1.0),1.4);
	return lensFlare;
}

float genAnaLens(vec2 lightPos){
	return pow(max(1.0-length(pow(abs(texcoord.xy-lightPos.xy-0.5),vec2(0.5,0.8))*vec2(aspectRatio*0.2,2.0))*4,0.0),2.2);
}

vec3 getColor(vec3 color, float truepos){
	return mix(color,length(color/3)*light_n*0.25,truepos*0.49+0.49)*mix(sunVisibility,moonVisibility,truepos*0.5+0.5);
}

float getLensVisibilityA(vec2 lightPos){
	float str = length(lightPos*vec2(aspectRatio,1.0));
	return (pow(clamp(str*8.0,0.0,1.0),2.0)-clamp(str*3.0-1.5,0.0,1.0));
}

float getLensVisibilityB(vec2 lightPos){
	float str = length(lightPos*vec2(aspectRatio,1.0));
	return (1.0-clamp(str*3.0-1.5,0.0,1.0));
}

vec3 genLensFlare(vec2 lightPos,float truepos,float visiblesun){
	vec3 final = vec3(0.0);
	float visibilitya = getLensVisibilityA(lightPos);
	float visibilityb = getLensVisibilityB(lightPos);
	if (visibilityb > 0.001){
		vec3 lensFlareA = genLens(lightPos,0.3,-0.45,1)*getColor(vec3(2.2, 1.2, 0.1),truepos) * 0.07;
			 lensFlareA+= genLens(lightPos,0.3,0.10,1) * getColor(vec3(2.2, 0.4, 0.1),truepos) * 0.03;
			 lensFlareA+= genLens(lightPos,0.3,0.30,1) * getColor(vec3(2.2, 0.1, 0.05),truepos) * 0.04;
			 lensFlareA+= genLens(lightPos,0.3,0.50,1) * getColor(vec3(2.2, 0.4, 2.5),truepos) * 0.05;
			 lensFlareA+= genLens(lightPos,0.3,0.70,1) * getColor(vec3(1.8, 0.4, 2.5),truepos) * 0.06;
			 lensFlareA+= genLens(lightPos,0.3,0.90,1) * getColor(vec3(0.1, 0.2, 2.5),truepos) * 0.07;

		vec3 lensFlareB = genMultLens(lightPos,0.08,-0.28,-0.39) * getColor(vec3(2.5, 1.2, 0.1),truepos) * 0.015;
			 lensFlareB+= genMultLens(lightPos,0.08,-0.20,-0.31) * getColor(vec3(2.5, 0.5, 0.05),truepos) * 0.010;
			 lensFlareB+= genMultLens(lightPos,0.12,0.06,0.19) * getColor(vec3(2.5, 0.1, 0.05),truepos) * 0.020;
			 lensFlareB+= genMultLens(lightPos,0.12,0.15,0.28) * getColor(vec3(1.8, 0.1, 1.2),truepos) * 0.015;
			 lensFlareB+= genMultLens(lightPos,0.12,0.24,0.37) * getColor(vec3(1.0, 0.1, 2.5),truepos) * 0.010;

		vec3 lensFlareC = genPointLens(lightPos,0.03,-0.55,0.5) * getColor(vec3(2.5, 1.6, 0.0),truepos) * 0.10;
			 lensFlareC+= genPointLens(lightPos,0.02,-0.4,0.5) * getColor(vec3(2.5, 1.0, 0.0),truepos) * 0.10;
			 lensFlareC+= genPointLens(lightPos,0.04,0.425,0.5) * getColor(vec3(2.5, 0.6, 0.6),truepos) * 0.15;
			 lensFlareC+= genPointLens(lightPos,0.02,0.6,0.5) * getColor(vec3(0.2, 0.6, 2.5),truepos) * 0.10;
			 lensFlareC+= genPointLens(lightPos,0.03,0.675,0.25) * getColor(vec3(0.7, 1.1, 3.0),truepos) * 0.3;

		vec3 lensFlareD = genRingLens(lightPos,0.22,0.44,0.46) * getColor(vec3(0.1, 0.35, 2.5),truepos) * 0.4;
			 lensFlareD+= genRingLens(lightPos,0.15,0.98,0.99) * getColor(vec3(0.15, 0.4, 2.55),truepos) * 2.0;

		vec3 lensFlareE = genAnaLens(lightPos) * getColor(vec3(0.1,0.4,1.0),truepos) * 0.4;

		final = (((lensFlareA+lensFlareB)+(lensFlareC+lensFlareD)) * visibilitya+lensFlareE * visibilityb) * pow(visiblesun,2.0) * (1.0 - rain0) * (1.0 - isEyeInWater * 0.9);
	}

	return final;
}
#endif

void getLensFlare(inout Tone t) {
	#ifdef LF
	color = lensFlare(t.color, texcoord);
	#endif
	
	#ifdef BSL_LENS_FLARE
	vec4 tpos = vec4(sunPosition,1.0)*gbufferProjection;
	tpos = vec4(tpos.xyz/tpos.w,1.0);
	tpos.xy = tpos.xy/tpos.z;
	vec2 lightPos = tpos.xy*0.5;
	float truepos = sunPosition.z/abs(sunPosition.z);
	float visiblesun = (0.75-0.25*dot(t.color,vec3(0.299, 0.587, 0.114)));

	t.color += genLensFlare(lightPos,truepos,visiblesun) * min((1.0-blindness), 1.0) * (1.0 - isEyeInWater0) * step(0.001, visiblesun);
    #endif
}
/*vec3 lensflare1(vec2 uv,vec2 pos)
{
    float intensity = 1.5;
	vec2 main = uv-pos;
	vec2 uvd = uv*(length(uv));

	float dist=length(main); dist = pow(dist,.1);


	float f1 = max(0.01-pow(length(uv+1.2*pos),1.9),.0)*7.0;

	float f2 = max(1.0/(1.0+32.0*pow(length(uvd+0.8*pos),2.0)),.0)*00.1;
	float f22 = max(1.0/(1.0+32.0*pow(length(uvd+0.85*pos),2.0)),.0)*00.08;
	float f23 = max(1.0/(1.0+32.0*pow(length(uvd+0.9*pos),2.0)),.0)*00.06;

	vec2 uvx = mix(uv,uvd,-0.5);

	float f4 = max(0.01-pow(length(uvx+0.4*pos),2.4),.0)*6.0;
	float f42 = max(0.01-pow(length(uvx+0.45*pos),2.4),.0)*5.0;
	float f43 = max(0.01-pow(length(uvx+0.5*pos),2.4),.0)*3.0;

	uvx = mix(uv,uvd,-.4);

	float f5 = max(0.01-pow(length(uvx+0.2*pos),5.5),.0)*2.0;
	float f52 = max(0.01-pow(length(uvx+0.4*pos),5.5),.0)*2.0;
	float f53 = max(0.01-pow(length(uvx+0.6*pos),5.5),.0)*2.0;

	uvx = mix(uv,uvd,-0.5);

	float f6 = max(0.01-pow(length(uvx-0.3*pos),1.6),.0)*6.0;
	float f62 = max(0.01-pow(length(uvx-0.325*pos),1.6),.0)*3.0;
	float f63 = max(0.01-pow(length(uvx-0.35*pos),1.6),.0)*5.0;

	vec3 c = vec3(.0);

	c.r+=f2+f4+f5+f6; c.g+=f22+f42+f52+f62; c.b+=f23+f43+f53+f63;
	c = c*1.3 - vec3(length(uvd)*.05);

	return c * intensity;
}

vec3 cc(vec3 color, float factor,float factor2) // color modifier
{
	float w = color.x+color.y+color.z;
	return mix(color,vec3(w)*factor,w*factor2);
}*/

#endif
#endif