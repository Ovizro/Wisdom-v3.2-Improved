#if !(defined _INCLUDE_ANIMATION)
#define _INCLUDE_ANIMATION

/* 
 * Copyright 2019 Ovizro
 *
 * This is the first shader effect made by Ovizro.
 * It includes a quantity of animation.
 * Some of them might seem to be a little crazy.
 * By the way, a LOGO of my team, HyperCol Studio, has been included in it.
 * Wish you can enjoy it.
 */
 
uniform float frameTime;
uniform int frameCounter;
uniform bool hideGUI;
 
//#define ANIMATION_DEBUG
#define DELAY 5.0 			//[0.0 0.5 1.0 1.5 2.0 2.5 3.0 3.5 4.0 4.5 5.0 6.0 7.0 8.0 9.0 10.0 11.0 12.0 13.0 14.0 15.0 16.0 17.0 18.0 19.0 20.0]
#define FRAME_COUNTERS 50.0	//[20.0 30.0 50.0 70.0 100.0 150.0 200.0]

//AnimationTime
float fFrameCounter = float(frameCounter);
#ifndef ANIMATION_DEBUG
float animationTimeCounter = mix(max(frameTimeCounter - DELAY, 0.0), 100.0, step(FRAME_COUNTERS * (12.0 + DELAY), fFrameCounter));
#else
float animationTimeCounter = fract(frameTimeCounter * 0.1) * 10.0;//5.0;//
#endif

#define CORNER_MARK 0 //[0 1 2 3]

#ifdef HYPERCOL_LODO_ANIMATION
varying vec2 logoPos[8];
varying float Ltheter;
#endif

#if CORNER_MARK > 0
varying mat3 cLogo;
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

mat3 mRotate(float theter) {
	float s = sin(theter);
	float c = cos(theter);
	return mat3(c,     -s,   0.0, 
			       s,    c,     0.0, 
                               0.0, 0.0, 1.0);
}

mat3 cTrack() {						//Running track of corner mark  
	const float size = 6.6666;
	float theter = -frameTimeCounter * 0.6;

	mat3 r0 = mat3(size, 0.0, -cos(theter), 
                                 0.0, size, -sin(theter), 
                                 0.0, 0.0,   1.0            );
	const float l = 1.0 / 0.4142;
	mat3 r1 = mat3(l, 0.0, 0.0, 
                                 0.0, l, 0.0, 
                                 0.0, 0.0, 1.0);
	mat3 r2 = mRotate(theter - PI * 0.5);

	return r2 * r1 * r0;
}

void animationCommons() {
	//HyperCol Logo
	#ifdef HYPERCOL_LODO_ANIMATION
	
	#endif

	//corner mark
	#if CORNER_MARK > 0
	cLogo = cTrack();
	#endif
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

vec2 fuv_build(in vec2 uv) {                //Establish coordinate system with screen as center
    vec2 fuv = uv * 2.0 - 1.0;
    fuv.x *= aspectRatio;
    return fuv;
}

/*
 *==============================================================================
 *[																				]
 *[		----------------		Simple Animation		----------------		]
 *[																				]
 *==============================================================================
 */

#define ROTATE               0.0     //[-2.0 -1.5 -1.0 -0.5 0.0 0.5 1.0 1.5 2.0]
#define ROTATING_TIME 3.0   //[0.5 1.0 1.5 2.0 2.5 3.0 3.5 4.0 4.5 5.0 5.5 6.0]
#define ROTATING_SCALE 0.0 //[0.0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0 1.2 1.5 1.7 2.0 2.5 3.0 4.0 5.0 8.0]

#define SHADE_ROTATE 0.0     //[-2.0 -1.5 -1.0 -0.5 0.0 0.5 1.0 1.5 2.0]
#define SHADE_ROTATING_TIME 3.0   //[0.5 1.0 1.5 2.0 2.5 3.0 3.5 4.0 4.5 5.0 5.5 6.0]
#define SHADE_ROTATING_SCALE 3.0 //[0.0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0 1.2 1.5 1.7 2.0 2.5 3.0 4.0 5.0 8.0]

//#define WHITE_SHADE
#define TRANSLUCENT_SHADE  				//Only for black shade
//#define TRANSLUCENT_SHADE_BLUR

//#define RECTANGULAR_SHADE
#define ANAMORPHIC_EDGE 1.0				//[0.0 0.5 0.55 0.65 0.7 0.75 0.8 0.85 0.9 0.95 1.0]
#define TRANSLUCENT_ANAMORPHIC_EDGE 1.0	//[0.0 0.5 0.55 0.65 0.7 0.75 0.8 0.85 0.9 0.95 1.0]
#define ANAMORPHIC_CONTRACT_SPEED 0.5	//[0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0 1.1 1.2 1.3 1.4 1.5 1.6 1.7 1.8 1.9 2.0]
#define TRANSLUCENT_ANAMORPHIC_CONTRACT_SPEED 0.4	//[0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0 1.1 1.2 1.3 1.4 1.5 1.6 1.7 1.8 1.9 2.0]

#define LOZENGULAR_SHADE
#define LOZENGULAR_SHADE_PAUSE
#define LOZENGULAR_SHADE_MIDDLE_TIME 1.0 				//[0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0 1.1 1.2 1.3 1.4 1.5 1.6 1.7 1.8 1.9 2.0]
#define LOZENGULAR_SHADE_MIDDLE_POSITION 0.6				//[0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0 1.1 1.2 1.3 1.4 1.5 1.6 1.7 1.8 1.9 2.0]
#define TRANSLUCENT_LOZENGULAR_SHADE_MIDDLE_POSITION 0.4	//[0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0 1.1 1.2 1.3 1.4 1.5 1.6 1.7 1.8 1.9 2.0]

//#define ROUND_SHADE
#define ROUND_SHADE_PAUSE
#define ROUND_SHADE_MIDDLE_TIME 1.0 				//[0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0 1.1 1.2 1.3 1.4 1.5 1.6 1.7 1.8 1.9 2.0]
#define ROUND_SHADE_MIDDLE_POSITION 0.6				//[0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0 1.1 1.2 1.3 1.4 1.5 1.6 1.7 1.8 1.9 2.0]
#define TRANSLUCENT_ROUND_SHADE_MIDDLE_POSITION 0.5	//[0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0 1.1 1.2 1.3 1.4 1.5 1.6 1.7 1.8 1.9 2.0]

mat2 mRotate(float theter) {
	float s = sin(theter);
	float c = cos(theter);
	return mat2(c, -s,
				s,  c);
}

void rotate(inout vec2 uv, in float theter) {
	uv = mRotate(theter) * uv;
}

float lozenge(in vec2 puv, float edge) {
	float e0 = puv.x + puv.y;
	return step(edge, e0);
}

float round(in vec2 puv, float r) {
	float e0 = dot(puv, puv);
	return step(pow2(r), e0);
}

float triangle(in vec2 puv) {					//Build an equilateral triangle
	float e1 = 0.57735 * (1.0 - puv.x) - abs(puv.y);
	float e2 = puv.x + 1.0; 
	return min(smoothstep(0.0, 0.05, e1), smoothstep(0.0, 0.0443, e2));
}

float func3(in float x, float m, float mY) {
	float a = mY / pow3(m);
	float b = -a * m * 3.0;
	float c = -b * m;
	return fma(x, fma(x, a, b), c) * x;
}

void simple_animation(inout Tone t, vec2 fuv) {
	//rotation
	vec2 uv = texcoord;
	vec2 rM = vec2(ROTATE * min(animationTimeCounter - ROTATING_TIME, 0.0), SHADE_ROTATE * min(animationTimeCounter - SHADE_ROTATING_TIME, 0.0));
	vec2 l = vec2(smoothstep(- ROTATING_TIME, ROTATING_TIME, animationTimeCounter), smoothstep(-SHADE_ROTATING_TIME, SHADE_ROTATING_TIME, animationTimeCounter)) * 2.0 - 1.0;
	l = mix(vec2 ROTATING_SCALE, SHADE_ROTATING_SCALE), vec2(1.0), l);
	rotate(uv, rM.x);
	rotate(fuv, rM.y);
	uv /= l.x;
	fuv /= l.y;
	vec3 color = texture2D(composite, uv).rgb * Cselect(uv, 0.0, 1.0);
	float t0 = smoothstep(ROTATING_TIME, ROTATING_TIME + 1.0, animationTimeCounter);
	t.color = mix(color, t.color, t0);
	t.blurIndex *= t0;
	
	//shade
	fuv = abs(fuv);
	//rectangle
	#ifdef RECTANGULAR_SHADE
	float e0 = step(fuv.y, min(animationTimeCounter * ANAMORPHIC_CONTRACT_SPEED, ANAMORPHIC_EDGE));
	float e1 = 1.0 - step(min(animationTimeCounter * TRANSLUCENT_ANAMORPHIC_CONTRACT_SPEED, TRANSLUCENT_ANAMORPHIC_EDGE), fuv.y) * 0.5;
	#else
	float e0 = 1.0;
	float e1 = 1.0;
	#endif
	
	//lozenge
	#ifdef LOZENGULAR_SHADE
	#ifdef LOZENGULAR_SHADE_PAUSE
	float l0 = 1.0 - lozenge(fuv, func3(animationTimeCounter, LOZENGULAR_SHADE_MIDDLE_TIME, LOZENGULAR_SHADE_MIDDLE_POSITION));
	float l1 = 1.0 - lozenge(fuv, func3(animationTimeCounter, LOZENGULAR_SHADE_MIDDLE_TIME, TRANSLUCENT_LOZENGULAR_SHADE_MIDDLE_POSITION)) * 0.5;
	#else
	float l0 = 1.0 - lozenge(fuv, animationTimeCounter / LOZENGULAR_SHADE_MIDDLE_TIME * LOZENGULAR_SHADE_MIDDLE_POSITION);
	float l1 = 1.0 - lozenge(fuv, animationTimeCounter / LOZENGULAR_SHADE_MIDDLE_TIME * TRANSLUCENT_LOZENGULAR_SHADE_MIDDLE_POSITION) * 0.5;
	#endif
	#else
	float l0 = 1.0;
	float l1 = 1.0;
	#endif
	
	//Round
	#ifdef ROUND_SHADE
	#ifdef ROUND_SHADE_PAUSE
	float r0 = 1.0 - round(fuv, func3(animationTimeCounter, ROUND_SHADE_MIDDLE_TIME, ROUND_SHADE_MIDDLE_POSITION));
	float r1 = 1.0 - round(fuv, func3(animationTimeCounter, ROUND_SHADE_MIDDLE_TIME, TRANSLUCENT_ROUND_SHADE_MIDDLE_POSITION)) * 0.5;
	#else
	float r0 = 1.0 - round(fuv, animationTimeCounter / ROUND_SHADE_MIDDLE_TIME * ROUND_SHADE__MIDDLE_POSITION);
	float r1 = 1.0 - round(fuv, animationTimeCounter / ROUND_SHADE_MIDDLE_TIME * TRANSLUCENT_ROUND_SHADE_MIDDLE_POSITION) * 0.5;
	#endif
	#else
	float r0 = 1.0;
	float r1 = 1.0;
	#endif
	
	float c0 = min(min(e0, l0), r0);
	float c1 = min(min(e1, l1), r1);
	#ifdef TRANSLUCENT_SHADE_BLUR
	t.blurIndex = plus(t.blurIndex, (1.0 - c1) * 1.6);
	#endif
	#ifdef TRANSLUCENT_SHADE
	float c = c0 * c1;
	#else
	float c = c0;
	#endif
	#ifndef WHITE_SHADE
	t.color *= c;
	t.blur *= c;
	#else
	//c = step(1.0, c);
	t.color = mix(vec3(1.0), t.color, c0);
	t.blur = mix(vec3(1.0), t.blur, c0);
	t.useAdjustment *= c0;
	#endif
}

/*
 *==============================================================================
 *[																				]
 *[		----------------		HyperCol Logo			----------------		]
 *[																				]
 *==============================================================================
 */

#ifdef HYPERCOL_LODO_ANIMATION

#endif

/*
 *==============================================================================
 *[																				]
 *[		----------------		 Eyes Open				----------------		]
 *[																				]
 *==============================================================================
 */

#if ANIMATION == 2
float E_ellipse(in vec2 puv, float eY) {
	float e0 = pow2(puv.x) / 2.6 + pow2(puv.y) / eY;
	return smoothstep(0.3, 1.0, e0);
}

void eyes_open(inout Tone t, vec2 fuv) {
	float eY = (sin(PI * 0.2 * animationTimeCounter) * 0.714 + sin(PI * 0.6 * animationTimeCounter) * 1.42857 + pow(1.3, animationTimeCounter) - 1.0) * 0.2353;
	
	float e = 1.0 - E_ellipse(fuv, eY) * (1.0 - smoothstep(6.5, 7.5, animationTimeCounter));
	t.color *= e;
	t.blur *= e;
	t.blurIndex = plus(t.blurIndex, (1.0 - eY) * (1.0 - smoothstep(6.5, 7.5, animationTimeCounter)));
}
#endif

/*
 *==============================================================================
 *[																				]
 *[		----------------		Corner Marks			------------------		]
 *[																				]
 *==============================================================================
 */

#if CORNER_MARK > 0
void cornerMark(inout Tone t, in vec2 fuv0) {
    vec2 fuv = fuv0;
	fuv += vec2(aspectRatio - 0.3, -0.7);

	if (hideGUI) {
		//HyperCol Logo
		const vec3 logoColor = vec3(0.0, 0.62, 0.9);
		float logo = 0.0;
		const mat2 r45 = mRotate(PI * 0.25);
			
		//float Ctheter;
		//vec2 basePoint0 = cTrack(Ctheter);
	
		for (int i = 0; i < 8; ++i) {
			fuv = r45 * fuv;
			vec3 puv = cLogo * vec3(fuv, 1.0);//cornermark_puv_build(fuv, basePoint0, Ctheter);
			logo += triangle(puv.st);
		}
		
		logo *= smoothstep(8.0, 10.0, animationTimeCounter);
		
		#if CORNER_MARK == 1
		t.color = mix(t.color, logoColor, logo);
		t.blurIndex *= (1.0 - logo);
		#elif CORNER_MARK == 2
		t.brightness *= (1.0 - logo * 0.1);
		t.blurIndex = plus(t.blurIndex, 0.3 * logo);
		#elif CORNER_MARK == 3
		t.color += vec3(0.1) * logo;
		t.brightness *= (1.0 + logo * 0.1);
		t.blurIndex = plus(t.blurIndex, 0.7 * logo);
		#endif
	}
}
#endif

/*
 *==============================================================================
 *[																				]
 *[		----------------		Main Animation			------------------		]
 *[																				]
 *==============================================================================
 */

void animation(inout Tone t, vec2 uv) {
	vec2 fuv = fuv_build(uv);
	
	//corner mark
	#if CORNER_MARK >= 1
	cornerMark(t, fuv);
	#endif
	
	/*HyperCol Logo
	#ifdef HYPERCOL_LODO_ANIMATION
	vec3 background = vec3(1.0) * smoothstep(1.5, 3.0, animationTimeCounter);
  	HyperCol_Logo(background, fuv);
	t.color = mix(background, t.color, smoothstep(8.0, 10.0, animationTimeCounter));
	t.useAdjustment *= smoothstep(8.0, 10.0, animationTimeCounter);
	#endif*/
	
	#if ANIMATION == 2
	eyes_open(t, fuv);
	#endif
	
	#if ANIMATION == 3
	simple_animation(t, fuv);
	#endif
}
#endif
#endif
