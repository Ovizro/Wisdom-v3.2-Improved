#if !(defined _INCLUDE_EFFECTS)
#define _INCLUDE_EFFECTS

uniform sampler2D depthtex2;

const vec4 totalTexPos[] = vec4[2] (
	vec4(0.0, 0.5, 0.25, 0.1),
	vec4(0.0, 0.8, 0.1, 0.2)
);

vec4 getTexColor(in vec2 uv, int key, vec2 start, float size) {
	vec4 tPos = totalTexPos[key];
	vec2 fuv = (uv - start) * tPos.z / size;
	fuv.y *= 2.0;
	if (min(fuv.x, fuv.y) >= 0.0 && fuv.x <= tPos.z && fuv.y <= tPos.w) {
		return texture2D(depthtex2, fuv + tPos.xy);
	} else {
		return vec4(0.0);
	}	
}

#define BLOOM
#define DOF 2 //[0 1 2 3 4 5 6]	Thanks for ErDan's helping.

#define EFFECT_STRENGTH 0.6 //[0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0 1.1 1.2 1.3 1.4 1.5 1.7 2.0]
#define DIRTY_LENS 2 // [0 1 2]
//0 close || 1 Old || 2 Original
#define DIRTY_LENS_STRENGTH 0.2 // [0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.5 0.6 0.7 0.8 0.9 1.0]

//#define CIRCULAR_BOKEN //Closing it will be considered as Hexagonal boken.
	#define FringeOffset 0.5 //[0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0]
	
#define FOCUS_BLUR
	#define BlurAmount 0.045 //[0.01 0.011 0.012 0.013 0.014 0.015 0.016 0.017 0.018 0.019 0.02 0.021 0.022 0.023 0.024 0.025 0.026 0.027 0.028 0.029 0.03 0.031 0.032 0.033 0.034 0.035 0.036 0.037 0.038 0.039 0.04 0.041 0.042 0.043 0.044 0.045 0.046 0.047 0.048 0.049 0.05 0.051 0.052 0.053 0.054 0.055 0.056 0.057 0.058 0.059 0.06 0.061 0.062 0.063 0.064 0.065 0.066 0.067 0.068 0.069 0.07]
	
#define DISTANCE_BLUR 
	#define MaxDistanceBlurAmount 0.003 //[0.0004 0.0006 0.001 0.002 0.003 0.004 0.005 0.006 0.007 0.008 0.009 0.01]
	#define	DistanceBlurRange 450 //[300 350 400 450 500 550 600 650 700 750 800]

#define EDGE_BLUR
	#define EdgeBlurAmount 0.02 //[0.005 0.01 0.015 0.02 0.025 0.03 0.035 0.04 0.045 0.05]
	#define EdgeBlurDecline 3.0 //[2.0 3.0 4.0 5.0 6.0]

//#define NOISE_AND_GRAIN
#ifdef NOISE_AND_GRAIN
void noise_and_grain(inout vec3 color) {
	float r = hash(texcoord * viewWidth);
	float g = hash(texcoord * viewWidth + 1000.0);
	float b = hash(texcoord * viewWidth + 4000.0);
	float w = hash(texcoord * viewWidth - 1000.0);
	w *= hash(texcoord * viewWidth - 2000.0);
	w *= hash(texcoord * viewWidth - 3000.0);
	
	color = mix(color, vec3(r,g,b) * luma(color), pow(w, 3.0));
}
#endif

//#define EIGHT_BIT
#ifdef EIGHT_BIT
void bit8(out vec3 color) {
	vec2 grid = vec2(viewWidth / viewHeight, 1.0) * 120.0;
	vec2 texc = floor(texcoord * grid) / grid;
	
	float dither = bayer_16x16(texc, grid);
	vec3 c = texture2D(composite, texc).rgb * 16.0;
	color = floor(c + dither) / 16.0;
}
#endif

//#define FILMIC_CINEMATIC
//#define FILMIC_CINEMATIC_ANAMORPHIC
#ifdef FILMIC_CINEMATIC
void filmic_cinematic(inout vec3 color) {
	color = clamp(color, vec3(0.0), vec3(2.0));
	float w = luma(color);
	
	color = mix(vec3(w), max(color - vec3(w * 0.1), vec3(0.0)), 0.4 + w * 0.8);
	
	#ifdef BLOOM
	const vec2 center_avr = vec2(0.5) * 0.125 + vec2(0.0f, 0.25f) + vec2(0.000f, 0.025f);
	#else
	const vec2 center_avr = vec2(0.5);
	#endif
	vec3 center = texture2D(colortex0, center_avr).rgb;
	color = pow(color, 0.3 * center + 1.0);
	color /= luma(center) * 0.5 + 0.5;
	color *= (normalize(max(vec3(0.1), center)) * 0.3 + 0.7);
	
	#ifdef FILMIC_CINEMATIC_ANAMORPHIC
	if (viewHeight * distance(texcoord.y, 0.5) > viewWidth * 0.4285714 * 0.5)
		color *= 0.0;
	#endif
}
#endif

#ifdef MOTION_BLUR

#define MOTIONBLUR_MAX 0.1 //[0.01 0.03 0.05 0.07 0.1 0.15 0.2 0.3]
#define MOTIONBLUR_STRENGTH 0.5 //[0.1 0.2 0.3 0.4 0.5 0.65 0.7 0.8 0.9 1.0]
#define MOTIONBLUR_SAMPLE 6 //[2 3 4 5 6 7 8 9 10 11 12 13 14 15 99]

const float dSample = 1.0 / float(MOTIONBLUR_SAMPLE);

void motion_blur(in sampler2D screen, inout vec3 color, in vec2 uv, in vec3 viewPosition) {
	vec4 worldPosition = gbufferModelViewInverse * vec4(viewPosition, 1.0) + vec4(cameraPosition, 0.0);
	vec4 prevClipPosition = gbufferPreviousProjection * gbufferPreviousModelView * (worldPosition - vec4(previousCameraPosition, 0.0));
	vec4 prevNdcPosition = prevClipPosition / prevClipPosition.w;
	vec2 prevUv = prevNdcPosition.st * 0.5 + 0.5;
	vec2 delta = uv - prevUv;
	float dist = length(delta) * 0.25;
	if (dist < 0.000025) return;
	delta = normalize(delta);
	dist = min(dist, MOTIONBLUR_MAX);
	int num_sams = int(dist / MOTIONBLUR_MAX * MOTIONBLUR_SAMPLE) + 1;
	dist *= MOTIONBLUR_STRENGTH;
	delta *= dist * dSample;
	for(int i = 1; i < num_sams; i++) {
		uv += delta;
		color += texture2D(screen, uv).rgb;
	}
	color /= float(num_sams);
}
#endif

vec3 applyEffect(float total, float size,
	float a00, float a01, float a02,
	float a10, float a11, float a12,
	float a20, float a21, float a22,
	sampler2D sam, vec2 uv) {
	
	vec3 color = texture2D(sam, uv).rgb * a11;

	color += texture2D(sam, uv + size * vec2(-pixel.x, pixel.y)).rgb * a00;
	color += texture2D(sam, uv + size * vec2(0.0, pixel.y)).rgb * a01;
	color += texture2D(sam, uv + size * pixel).rgb * a00;
	color += texture2D(sam, uv + size * vec2(-pixel.x, 0.0)).rgb * a00;
	color += texture2D(sam, uv + size * vec2(pixel.x, 0.0)).rgb * a00;
	color += texture2D(sam, uv - size * pixel).rgb * a00;
	color += texture2D(sam, uv + size * vec2(0.0, -pixel.y)).rgb * a01;
	color += texture2D(sam, uv + size * vec2(pixel.x, -pixel.y)).rgb * a00;
	
	return max(color / total, vec3(0.0));
}

#if (defined(BLOOM) || (DOF > 0))

// 4x4 bicubic filter using 4 bilinear texture lookups 
// See GPU Gems 2: "Fast Third-Order Texture Filtering", Sigg & Hadwiger:
// http://http.developer.nvidia.com/GPUGems2/gpugems2_chapter20.html

// w0, w1, w2, and w3 are the four cubic B-spline basis functions
float w0(float a) {
    return (1.0/6.0)*(a*(a*(-a + 3.0) - 3.0) + 1.0);
}

float w1(float a) {
    return (1.0/6.0)*(a*a*(3.0*a - 6.0) + 4.0);
}

float w2(float a) {
    return (1.0/6.0)*(a*(a*(-3.0*a + 3.0) + 3.0) + 1.0);
}

float w3(float a) {
    return (1.0/6.0)*(a*a*a);
}

// g0 and g1 are the two amplitude functions
float g0(float a) {
    return w0(a) + w1(a);
}

float g1(float a) {
    return w2(a) + w3(a);
}

// h0 and h1 are the two offset functions
float h0(float a) {
    return -1.0 + w1(a) / (w0(a) + w1(a));
}

float h1(float a) {
    return 1.0 + w3(a) / (w2(a) + w3(a));
}

vec4 texture_Bicubic(sampler2D tex, vec2 uv)
{

	uv = uv * vec2(viewWidth, viewHeight) - 1.0;
	vec2 iuv = floor( uv );
	vec2 fuv = uv - iuv;

    float g0x = g0(fuv.x);
    float g1x = g1(fuv.x);
    float h0x = h0(fuv.x);
    float h1x = h1(fuv.x);
    float h0y = h0(fuv.y);
    float h1y = h1(fuv.y);

	vec2 texelSize = 1.0 / vec2(viewWidth, viewHeight);
	vec2 p0 = (vec2(iuv.x + h0x, iuv.y + h0y) + 0.5) * texelSize;
	vec4 t0 = texture2D(tex, p0);
	vec2 p1 = (vec2(iuv.x + h1x, iuv.y + h0y) + 0.5) * texelSize;
	vec4 t1 = texture2D(tex, p1);
	vec2 p2 = (vec2(iuv.x + h0x, iuv.y + h1y) + 0.5) * texelSize;
	vec4 t2 = texture2D(tex, p2);
	vec2 p3 = (vec2(iuv.x + h1x, iuv.y + h1y) + 0.5) * texelSize;
	vec4 t3 = texture2D(tex, p3);

    return g0(fuv.y) * (g0x * t0  +
                        g1x * t1) +
           g1(fuv.y) * (g0x * t2  +
                        g1x * t3);
}

vec3 bloom(inout vec3 c, out vec3 blur) {
	vec2 tex = texcoord * 0.25;
	vec2 pix_offset = pixel;
	vec3 color = texture_Bicubic(colortex0, tex - pix_offset).rgb;
	tex = texcoord * 0.125 + vec2(0.0f, 0.35f) + vec2(0.000f, 0.035f);
	color += texture_Bicubic(colortex0, tex - pix_offset).rgb;
	tex = texcoord * 0.0625 + vec2(0.125f, 0.35f) + vec2(0.030f, 0.035f);
	color += texture_Bicubic(colortex0, tex - pix_offset).rgb;
	tex = texcoord * 0.03125 + vec2(0.1875f, 0.35f) + vec2(0.060f, 0.035f);
	color += texture_Bicubic(colortex0, tex - pix_offset).rgb;
	tex = texcoord * 0.015625 + vec2(0.21875f, 0.35f) + vec2(0.090f, 0.035f);
	color += texture_Bicubic(colortex0, tex - pix_offset).rgb;

	color *= 0.2;	
	blur = color;
	float l = luma(color);
	
	// Dirty lens
	#if DIRTY_LENS >= 1
	vec2 ext_tex = (texcoord - 0.5) * 0.5 + 0.5;
	tex = ext_tex * 0.03125 + vec2(0.1875f, 0.35f) + vec2(0.060f, 0.035f);
	vec3 color_huge = texture_Bicubic(colortex0, tex - pix_offset).rgb;
	tex = ext_tex * 0.015625 + vec2(0.21875f, 0.25f) + vec2(0.090f, 0.03f);
	color_huge += texture_Bicubic(colortex0, tex - pix_offset).rgb;
	
	float lh = luma(color_huge) * 0.5;
	if (lh > 0.2) {
		vec2 uv = texcoord;
		uv.y = uv.y / viewWidth * viewHeight;
		float col = smoothstep(0.4, 0.6, lh);
		float lenStrongth = DIRTY_LENS_STRENGTH;
		
		#if DIRTY_LENS == 1
		float n = abs(simplex2D(uv * 10.0));
		n += simplex2D(uv * 6.0 + 0.4) * 0.4;
		n += simplex2D(uv * 3.0 + 0.7);
		n = clamp(n * 0.3, 0.0, 1.0) * 2.0 * lenStrongth;;
		c = mix(c, mix(color, color_huge, 0.7), n * col * 0.5);
		#endif
		
		#if DIRTY_LENS == 2
		vec3 lens = texture_Bicubic(depthtex2, texcoord * 0.5).rgb * lenStrongth * 3.0;
		c = mix(c, mix(color, color_huge * lens, 0.7), lens * col);
		#endif
		
	}
	#endif
	
	return color * float(EFFECT_STRENGTH);
}

#if DOF > 0 && defined _INCLUDE_TONE
vec3 GetColorTexture(in vec2 coord) {
	return texture_Bicubic(composite, coord.st).rgb;
}
vec2 dispersion(in vec2 uv, float e) {
	e = 1.0 - e * 0.04;
	return (e * uv + vec2(1.0 - e) * 0.5);
}
float ld(float depth) {	return linearizeDepth(depth) * 0.5; 	}

void dof(inout Tone t, vec2 texcoord, bool is_hand) {

	float depth = mix(texture2D(depthtex0, texcoord.st).x, texture2D(depthtex1, texcoord.st).x, isEyeInWater1);
	float naive = 0.0;

	#ifdef FOCUS_BLUR
	naive += abs(depth - clamp(centerDepthSmooth, 0.2, 0.995)) * BlurAmount * 1.6;
	#endif

	#ifdef DISTANCE_BLUR
	naive += clamp(1.0-(exp(-pow(ld(depth)/DistanceBlurRange*far,4.0-rain0)*3.0)),0.0,MaxDistanceBlurAmount);//depth * 0.00001;//
	#endif

	#ifdef EDGE_BLUR
	naive += pow(dot(texcoord.st - vec2(0.5), texcoord.st - vec2(0.5)),EdgeBlurDecline * 0.5) * EdgeBlurAmount;
	#endif

	vec2 aspectcorrect = vec2(1.0, aspectRatio) * 1.6;
	vec3 col = vec3(0.0);
	col += GetColorTexture(texcoord.st);
	naive *= (1.0 - float(is_hand) * 0.9);

	#if DOF == 1
	t.blurIndex = naive * 180.0;
	#elif DOF == 2
	t.blur.r = texture2D(colortex0, dispersion(texcoord, FringeOffset)).r;
	t.blur.g = texture2D(colortex0, texcoord).g;
	t.blur.b = texture2D(colortex0, dispersion(texcoord, -FringeOffset)).b;
	t.blurIndex = log2(naive * 160.0 + 1.0);
	//t.color = vec3(naive * 128.0);
	#else
	#if DOF == 4 || DOF == 6
	const vec2 offsets[60] = vec2[60](vec2(  0.2165,  0.1250 ),
									vec2(  0.0000,  0.2500 ),
									vec2( -0.2165,  0.1250 ),
									vec2( -0.2165, -0.1250 ),
									vec2( -0.0000, -0.2500 ),
									vec2(  0.2165, -0.1250 ),
									vec2(  0.4330,  0.2500 ),
									vec2(  0.0000,  0.5000 ),
									vec2( -0.4330,  0.2500 ),
									vec2( -0.4330, -0.2500 ),
									vec2( -0.0000, -0.5000 ),
									vec2(  0.4330, -0.2500 ),
									vec2(  0.6495,  0.3750 ),
									vec2(  0.0000,  0.7500 ),
									vec2( -0.6495,  0.3750 ),
									vec2( -0.6495, -0.3750 ),
									vec2( -0.0000, -0.7500 ),
									vec2(  0.6495, -0.3750 ),
									vec2(  0.8660,  0.5000 ),
									vec2(  0.0000,  1.0000 ),
									vec2( -0.8660,  0.5000 ),
									vec2( -0.8660, -0.5000 ),
									vec2( -0.0000, -1.0000 ),
									vec2(  0.8660, -0.5000 ),
									vec2(  0.2163,  0.3754 ),
									vec2( -0.2170,  0.3750 ),
									vec2( -0.4333, -0.0004 ),
									vec2( -0.2163, -0.3754 ),
									vec2(  0.2170, -0.3750 ),
									vec2(  0.4333,  0.0004 ),
									vec2(  0.4328,  0.5004 ),
									vec2( -0.2170,  0.6250 ),
									vec2( -0.6498,  0.1246 ),
									vec2( -0.4328, -0.5004 ),
									vec2(  0.2170, -0.6250 ),
									vec2(  0.6498, -0.1246 ),
									vec2(  0.6493,  0.6254 ),
									vec2( -0.2170,  0.8750 ),
									vec2( -0.8663,  0.2496 ),
									vec2( -0.6493, -0.6254 ),
									vec2(  0.2170, -0.8750 ),
									vec2(  0.8663, -0.2496 ),
									vec2(  0.2160,  0.6259 ),
									vec2( -0.4340,  0.5000 ),
									vec2( -0.6500, -0.1259 ),
									vec2( -0.2160, -0.6259 ),
									vec2(  0.4340, -0.5000 ),
									vec2(  0.6500,  0.1259 ),
									vec2(  0.4325,  0.7509 ),
									vec2( -0.4340,  0.7500 ),
									vec2( -0.8665, -0.0009 ),
									vec2( -0.4325, -0.7509 ),
									vec2(  0.4340, -0.7500 ),
									vec2(  0.8665,  0.0009 ),
									vec2(  0.2158,  0.8763 ),
									vec2( -0.6510,  0.6250 ),
									vec2( -0.8668, -0.2513 ),
									vec2( -0.2158, -0.8763 ),
									vec2(  0.6510, -0.6250 ),
									vec2(  0.8668,  0.2513 ));
	#else
	const vec2 offsets[60] = vec2[60](vec2(  0.0000,  0.2500 ),
									vec2( -0.2165,  0.1250 ),
									vec2( -0.2165, -0.1250 ),
									vec2( -0.0000, -0.2500 ),
									vec2(  0.2165, -0.1250 ),
									vec2(  0.2165,  0.1250 ),
									vec2(  0.0000,  0.5000 ),
									vec2( -0.2500,  0.4330 ),
									vec2( -0.4330,  0.2500 ),
									vec2( -0.5000,  0.0000 ),
									vec2( -0.4330, -0.2500 ),
									vec2( -0.2500, -0.4330 ),
									vec2( -0.0000, -0.5000 ),
									vec2(  0.2500, -0.4330 ),
									vec2(  0.4330, -0.2500 ),
									vec2(  0.5000, -0.0000 ),
									vec2(  0.4330,  0.2500 ),
									vec2(  0.2500,  0.4330 ),
									vec2(  0.0000,  0.7500 ),
									vec2( -0.2565,  0.7048 ),
									vec2( -0.4821,  0.5745 ),
									vec2( -0.6495,  0.3750 ),
									vec2( -0.7386,  0.1302 ),
									vec2( -0.7386, -0.1302 ),
									vec2( -0.6495, -0.3750 ),
									vec2( -0.4821, -0.5745 ),
									vec2( -0.2565, -0.7048 ),
									vec2( -0.0000, -0.7500 ),
									vec2(  0.2565, -0.7048 ),
									vec2(  0.4821, -0.5745 ),
									vec2(  0.6495, -0.3750 ),
									vec2(  0.7386, -0.1302 ),
									vec2(  0.7386,  0.1302 ),
									vec2(  0.6495,  0.3750 ),
									vec2(  0.4821,  0.5745 ),
									vec2(  0.2565,  0.7048 ),
									vec2(  0.0000,  1.0000 ),
									vec2( -0.2588,  0.9659 ),
									vec2( -0.5000,  0.8660 ),
									vec2( -0.7071,  0.7071 ),
									vec2( -0.8660,  0.5000 ),
									vec2( -0.9659,  0.2588 ),
									vec2( -1.0000,  0.0000 ),
									vec2( -0.9659, -0.2588 ),
									vec2( -0.8660, -0.5000 ),
									vec2( -0.7071, -0.7071 ),
									vec2( -0.5000, -0.8660 ),
									vec2( -0.2588, -0.9659 ),
									vec2( -0.0000, -1.0000 ),
									vec2(  0.2588, -0.9659 ),
									vec2(  0.5000, -0.8660 ),
									vec2(  0.7071, -0.7071 ),
									vec2(  0.8660, -0.5000 ),
									vec2(  0.9659, -0.2588 ),
									vec2(  1.0000, -0.0000 ),
									vec2(  0.9659,  0.2588 ),
									vec2(  0.8660,  0.5000 ),
									vec2(  0.7071,  0.7071 ),
									vec2(  0.5000,  0.8660 ),
									vec2(  0.2588,  0.9659 ));
	#endif
	
	#if DOF == 3 || DOF == 4
	for ( int i = 0; i < 60; i += 2) {
		col += GetColorTexture(texcoord.st + offsets[i]*aspectcorrect*naive).rgb;
		if( isEyeInWater > 0)
        col += GetColorTexture(texcoord.st + offsets[i]*aspectcorrect*naive*isEyeInWater);
	}
	t.color = col/30;
	#else
	for ( int i = 0; i < 60; ++i) {
		col.g += GetColorTexture(texcoord.st + offsets[i]*aspectcorrect*naive).g; 
	    col.r += GetColorTexture(texcoord.st + (offsets[i]*aspectcorrect + vec2(FringeOffset))*naive).r; 
		col.b += GetColorTexture(texcoord.st + (offsets[i]*aspectcorrect - vec2(FringeOffset))*naive).b; 
		if( isEyeInWater > 0)
        col += GetColorTexture(texcoord.st + offsets[i]*aspectcorrect*naive*isEyeInWater);
	}
	t.color = col/60;
	#endif
	#endif
	t.blurIndex = clamp(t.blurIndex, 0.0, 1.0);
}
#endif
#endif

#endif
