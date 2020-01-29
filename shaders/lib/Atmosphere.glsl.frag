#if !(defined _INCLUDE_ATMOS)
#define _INCLUDE_ATMOS

#define PHYSICAL_SKY  //Add by eplor.
//#define MARS_ATMOSPHERE

//#define NEW_2D_CLOUD

#define PHYSICAL_SKY_LIGHT 2 //[1 2 3 4 5 6]
#define PHYSICAL_SKY_SMOOTH 4 //[1 2 3 4 5 6 7 8 9 10]

//=========================================================

float day = float(worldTime) / 24000.0;
float day_cycle = mix(float(moonPhase), mod(float(moonPhase + 1), 8.0), day) + frametime * 0.0001;
float cloud_coverage1 = max(noise(vec2(day_cycle, 0.0)) * 0.28, max(rain0, wetness));
float moonLight = (smoothstep(12800.0, 13000.0, float(worldTime)) - linearstep(13200.0, 16000.0, float(worldTime)) + linearstep(20000.0, 22600.0, float(worldTime)) - smoothstep(23000.0, 23300.0, float(worldTime)));

float skyLight = exp2(float(PHYSICAL_SKY_LIGHT));
float skySmooth = exp2(float(PHYSICAL_SKY_SMOOTH));

#ifdef MARS_ATMOSPHERE
const float R0 = 4389e3;
const float Ra = 4460e3;
float Hr = 10e3;
float Hm = 3.3e3;

const vec3 I0 = vec3(2.6);
const vec3 bR = vec3(33.1e-6, 13.5e-6, 5.8e-6);
#else
const float R0 = 6370e3;
float Ra = 6395e3 * (1.0 - Time.w * 0.002);
float Hr = 1.2e4 * (1.0 + (Time.x + Time.z) * 0.02 - Time.w *0.72 - cloud_coverage1 * 0.25 + rain0 * 0.2);
float Hm = 2.9e3 * (1.0 - max(Time.w * 0.42, max(cloud_coverage1 * 0.25, rain0 * 0.85)));

const vec3 I0 = vec3(10.0);
vec3 bR = (vec3(5.5e-6, 16.5e-6, 38.1e-6) * (1.0 - Time.w) + vec3(5.2e-6, 13.5e-6, 28.1e-6) * Time.w);
#endif

#if defined(AT_LSTEP) || defined(_VERTEX_SHADER_)
const int steps = 6;
const int stepss = 2;
const vec3 I = I0;
#else
int steps = int(ceil(min(skyLight, (64.0 - (Time.w - moonLight) * 60.0)) * max((1.0 - Time.w * 0.66 + moonLight * 0.35), 0.1)));
int stepss = int(skySmooth);
vec3 I = I0 * max((1.0 - max(cloud_coverage1 * 0.46,Time.w * 0.92) - cloud_coverage1 * 0.05), 0.05);
#endif

const float g = .76;
const float g2 = g * g;

const vec3 C = vec3(0., -R0, 0.);
const vec3 bM = vec3(27e-6);


void densities(in vec3 pos, out vec2 des) {
	// des.x = Rayleigh
	// des.y = Mie
	float h = length(pos - C) - R0;
	des.x = exp(-h/Hr);
	
	#ifndef MARS_ATMOSPHERE
	// Add Ozone layer densities
	des.x += exp(-max(0.0, (h - 35e3)) /  5e3) * exp(-max(0.0, (35e3 - h)) / 15e3) * 0.2;
	#endif
	
	#ifdef AT_LSTEP
	des.y = exp(-h/Hm);
	#else
	des.y = exp(-h/Hm) * (1.0 + cloud_coverage1);
	#endif
}

float escape(in vec3 p, in vec3 d, in float R) {
	vec3 v = p - C;
	float b = dot(v, d);
	float c = dot(v, v) - R*R;
	float det2 = b * b - c;
	if (det2 < 0.) return -1.;
	float det = sqrt(det2);
	float t1 = -b - det, t2 = -b + det;
	return (t1 >= 0.) ? t1 : t2;
}

#define PhaseEace(a,m,d) a*m*0.0133157277777778

// this can be explained: http://www.scratchapixel.com/lessons/3d-advanced-lessons/simulating-the-colors-of-the-sky/atmospheric-scattering/
vec3 scatter(vec3 o, vec3 d, vec3 Ds, float l) {
	if (d.y < 0.0) d.y = 0.0016 / (-d.y + 0.04) - 0.04;

	float L = min(l, escape(o, d, Ra));
	float mu = dot(d, Ds);
	float opmu2 = 1. + mu*mu;
	float phaseR = .0596831 * opmu2;
	float phaseM = .1193662 * (1. - g2) * opmu2;
	float phaseM_moon = phaseM / ((2. + g2) * pow(1. + g2 + 2.*g*mu, 1.5));
	phaseM /= ((2. + g2) * pow(1. + g2 - 2.*g*mu, 1.5));
	phaseM_moon *= max(0.5, l / 200e3);

	vec2 depth = vec2(0.0);
	vec3 R = vec3(0.), M = vec3(0.);

	float u0 = - (L - 100.0) / (1.0 - exp2(steps));

	for (int i = 0; i < steps; ++i) {
		float dl = u0 * exp2(i);
		float l = - u0 * (1 - exp2(i + 1));
		vec3 p = o + d * l;

		vec2 des;
		densities(p, des);
		des *= vec2(dl);
		depth += des;

		float Ls = escape(p, Ds, Ra);
		if (Ls > 0.) {
			float dls = Ls / float(stepss);
			vec2 depth_in = vec2(0.0);
			for (int j = 0; j < stepss; ++j) {
				float ls = float(j) * dls;
				vec3 ps = p + Ds * ls;
				vec2 des_in;
				densities(ps, des_in);
				depth_in += des_in;
			}
			depth_in *= vec2(dls);
			depth_in += depth;

			vec3 A = exp(-(bR * depth_in.x + bM * depth_in.y));
			R += A * des.x;
			M += A * des.y;
		} else {
			return vec3(0.);
		}
	}

	vec3 color = I * (R * bR * phaseR + M * bM * phaseM + vec3(0.0001, 0.00017, 0.0003) + (0.02 * vec3(0.005, 0.0055, 0.01)) * phaseM_moon * smoothstep(0.05, 0.2, d.y));
	return max(vec3(0.0), color);
}

#ifndef _VERTEX_SHADER_

/*
 *==============================================================================
 *------------------------------------------------------------------------------
 *
 * 								~Fragment stuff~
 *
 *------------------------------------------------------------------------------
 *==============================================================================
 */
 
const f16vec3 skyRGB = vec3(0.1502, 0.4056, 1.0);

void calc_fog(in float depth, in float start, in float end, inout vec3 original, in vec3 col) {
	original = mix(col, original, pow(clamp((end - depth) / (end - start), 0.0, 1.0), (1.0 - rain0) * 0.5 + 0.5));
}

void calc_fog_height(Material mat, in float16_t start, in float16_t end, inout f16vec3 original, in f16vec3 col) {
	float16_t coeif = 1.0 - clamp((end - mat.cdepth) / (end - start), 0.0, 1.0);
	coeif *= clamp((end - mat.wpos.y) / (end - start), 0.0, 1.0);
	coeif = pow(coeif, (1.0 - rain0) * 0.5 + 0.5);
	original = mix(original, col, coeif);
}

const f16vec3 vaporRGB = vec3(0.6) + skyRGB * 0.5;
f16vec3 mist_color = vaporRGB * f16vec3(luma(suncolor) * 0.1);

#define STARS
#define STAR_COLOR_TEMPERATURE 7000.0 //[2000.0 3000.0 4000.0 5000.0 6000.0 7000.0 8000.0 9000.0 10000.0 12000.0 40000.0]
#define STAR_LIGHT_LEVEL 0.3 //[0.1 0.2 0.3 0.5 0.7 1.0 1.5]
#define STAR_DENSITY 1.8 //[1.0 1.2 1.5 1.8 2.0 2.5]

#ifdef STARS
vec3 getStars(vec3 wpos, vec3 fragpos, vec3 light_n){
	wpos.y -= cameraPosition.y;
	vec3 intersection = wpos/(wpos.y+length(wpos.xz));
	vec2 wind = vec2(frametime * 0.5,0.0);
	vec2 coord = intersection.xz*0.3+cameraPosition.xz*0.0001+wind*0.00125;
	coord *= STAR_DENSITY;
	
	float NdotU = pow(max(dot(normalize(fragpos),normalize(upPosition)),0.0),0.25);
	
	float star  = texture2D(noisetex,coord.xy).r;
		  star *= texture2D(noisetex,coord.xy+0.1).r;
		  star *= texture2D(noisetex,coord.xy+0.23).r;
		  star *= texture2D(noisetex,coord.xy+0.456).r;
		  star *= texture2D(noisetex,coord.xy+0.7891).r;
		  star  = max(star-0.2,0.0)*10.0*NdotU*(1.0-rain0)*Time.w;
		
	return star*pow(light_n,vec3(0.8)) * STAR_LIGHT_LEVEL;
}
#endif

#ifdef PHYSICAL_SKY
f16vec3 calc_atmosphere(in f16vec3 sphere, in f16vec3 vsphere) {
	float16_t VdotS = dot(vsphere, lightPosition);
	VdotS = max(VdotS, 0.0) * (1.0 - extShadow);
	vec3 nwpos = normalize(sphere - vec3(0.0, 82.0, 0.0));
	vec3 skyColor = scatter(vec3(0., 19.82e2, 0.), nwpos, worldLightPosition * (1.0 - nTime.y * 0.6) * (1.0 - rain0 * 0.5), Ra) * (1.0 - rain0 * 0.8);
	
	#ifdef STARS
	vec3 star = getStars(sphere, vsphere, getLightColor(STAR_COLOR_TEMPERATURE));
	return skyColor + star;
	#else
	return skyColor;
	#endif
}
#else
f16vec3 calc_atmosphere(in f16vec3 sphere, in f16vec3 vsphere) {
	float16_t h = pow(max(normalize(sphere).y, 0.0), 2.0);
	f16vec3 at = skyRGB;

	at = mix(at, f16vec3(0.7), max(0.0, cloud_coverage));
	at *= 1.0 - (0.5 - rain0 * 0.3) * h;

	float16_t h2 = pow(max(0.0, 1.0 - h * 1.4), 2.0);
	at += h2 * mist_color * clamp(length(sphere) / 512.0, 0.0, 1.0) * 3.5;

	float16_t VdotS = dot(vsphere, lightPosition);
	VdotS = max(VdotS, 0.0) * (1.0 - extShadow);
	//float lSun = luma(suncolor);
	at = mix(at, suncolor + ambient, smoothstep(0.1, 1.0, h2 * pow(VdotS, fma(worldLightPosition.y, 2.0, 1.0))));
	at *= max(0.0, luma(ambient) * 1.2 - 0.02);

	at += suncolor * 0.009 * VdotS * (0.7 + cloud_coverage);
	//at += suncolor * 0.011 * pow(VdotS, 4.0) * (0.7 + cloud_coverage);
	at += suncolor * 0.015 * pow(VdotS, 8.0) * (0.7 + cloud_coverage);
	at += suncolor * 0.22 * pow(VdotS, 30.0) * (0.7 + cloud_coverage);

	//at += suncolor * 0.3 * pow(VdotS, 4.0) * rain0;

	return at;
}
#endif

const f16mat2 octave_c = f16mat2(1.4,1.2,-1.2,1.4);

f16vec4 calc_clouds(in f16vec3 sphere, in f16vec3 cam, float16_t dotS, in vec3 sunraw) {
	if (sphere.y < 0.0) return f16vec4(0.0);

	f16vec3 c = sphere / max(sphere.y, 0.001) * 768.0;
	c += noise((c.xz + cam.xz) * 0.001 + frametime * 0.01) * 200.0 / sphere.y;
	f16vec2 uv = (c.xz + cam.xz);

	uv.x += frametime * 10.0;
	uv *= 0.002;
	uv.y *= 0.75;
	float16_t n  = noise(uv * f16vec2(0.5, 1.0)) * 0.5;
		uv += f16vec2(n * 0.5, 0.3) * octave_c; uv *= 3.0;
		  n += noise(uv) * 0.25;
		uv += f16vec2(n * 0.9, 0.2) * octave_c + f16vec2(frametime * 0.1, 0.2); uv *= 3.01;
		  n += noise(uv) * 0.105;
		uv += f16vec2(n * 0.4, 0.1) * octave_c + f16vec2(frametime * 0.03, 0.1); uv *= 3.02;
		  n += noise(uv) * 0.0625;
	n = smoothstep(0.0, 1.0, n + cloud_coverage);

	n *= smoothstep(0.0, 140.0, sphere.y);

	return f16vec4(mist_color + pow(dotS, 3.0) * (1.0 - n) * sunraw * dot(nTime, vec4(1.0, 0.2, 1.0, 4.2))* dot(Time, vec4(2.5, 1.6, 2.8, 4.3)) * (1.0 - extShadow), 0.5 * n);
}

float calc_clouds0(in vec3 sphere, in vec3 cam) {
	if (sphere.y < 0.0) return 0.0;

	vec3 c = sphere / max(sphere.y, 0.001) * 768.0;
	c += noise_tex((c.xz + cam.xz) * 0.001 + frametime * 0.01) * 200.0 / sphere.y;
	vec2 uv = (c.xz + cam.xz);

	uv.x += frametime * 10.0;
	uv *= 0.002;
	float n  = noise_tex(uv * vec2(0.5, 1.0)) * 0.5;
		uv += vec2(n * 0.6, 0.0) * octave_c; uv *= 6.0;
		  n += noise_tex(uv) * 0.25;
		uv += vec2(n * 0.4, 0.0) * octave_c + vec2(frametime * 0.1, 0.2); uv *= 3.01;
		  n += noise(uv) * 0.105;
		uv += vec2(n, 0.0) * octave_c + vec2(frametime * 0.03, 0.1); uv *= 2.02;
		  n += noise(uv) * 0.0625;
	n = smoothstep(0.0, 1.0, n + cloud_coverage);

	n *= smoothstep(0.0, 140.0, sphere.y);

	return n;
}

float groundFogH(in float d, in float h, in vec3 rayDir) {
	const float b = 1.0;
	const float c = 1.0;
	float y = rayDir.y;
	return clamp(c * exp(-h*b) * (1.0-exp( -y*b ))/y, 0.0, 1.0);
}

float groundFog(in float d, in float h, in vec3 rayDir) {
	const float b = 1.0;
	const float c = 1.0;
	float y = rayDir.y;//sign(rayDir.y) * max(abs(rayDir.y), 0.00002);
	return clamp(c * exp(-h*b) * (1.0-exp( -d*y*b ))/y, 0.0, 1.0);
}

vec2 project_skybox2uv(vec3 nwpos) {
	vec2 rad = vec2(atan(nwpos.z, nwpos.x), asin(nwpos.y));
	rad += vec2(step(0.0, -rad.x) * (PI * 2.0), PI * 0.5);
	rad *= 0.25 / PI;
	return rad;
}

vec3 project_uv2skybox(vec2 uv) {
	vec2 rad = uv * 4.0 * PI;
    rad.y -= PI * 0.5;
    return normalize(vec3(cos(rad.x) * cos(rad.y), sin(rad.y), sin(rad.x) * cos(rad.y)));
}

#define CLOUDS 3 // [0 1 2 3]

#if CLOUDS >= 2
float16_t cloud_depth_map(in f16vec2 uv) {
	uv *= 0.001;

	float16_t n  = noise(uv * f16vec2(0.6, 1.0));
	uv += f16vec2(0.5, 0.3); uv *= 2.0; uv = octave_c * uv;
	 n += noise(uv) * 0.5;
	uv += f16vec2(0.9, 0.2) * octave_c + f16vec2(frametime * 0.1, 0.2); uv *= 2.01; uv = octave_c * uv;
	 n += noise(uv) * 0.25;
	uv += f16vec2(0.4, 0.1) * octave_c + f16vec2(frametime * 0.03, 0.1); uv *= 2.02; uv = octave_c * uv;
	 n += noise(uv) * 0.125;
	uv += f16vec2(0.2, 0.05) * octave_c + f16vec2(frametime * 0.01, 0.1); uv *= 2.03;
	 n += noise(uv) * 0.0625;
	uv += f16vec2(0.1, 0.025) * octave_c; uv *= 2.04;
	 n += noise(uv) * 0.03125;

	return clamp((n - 0.2 + cloud_coverage) * 1.4, 0.0, 1.0);
}

#define CLOUD_MIN 400.0 //[100.0 200.0 300.0 400.0 500.0 600.0 700.0 800.0 900.0 1000.0]
#define CLOUD_MAX 600.0 //[300.0 400.0 500.0 600.0 700.0 800.0 900.0 1000.0 1100.0 1200.0 1300.0 1400.0 1500.0]
float cloud_min = CLOUD_MIN;
float cloud_max = CLOUD_MAX;
float cloud_med = (CLOUD_MIN + CLOUD_MAX) / 2.0;
float cloud_half = CLOUD_MAX - cloud_med;

f16vec4 volumetric_clouds(in f16vec3 sphere, in f16vec3 cam, float16_t dotS, in vec3 sunraw) {
	if (sphere.y < -0.1 && cam.y < CLOUD_MIN - 1.0) return f16vec4(0.0);

	f16vec4 color = f16vec4(mist_color, 0.0);

	sphere.y += 0.1;
	f16vec3 ray = cam;
	f16vec3 ray_step = normalize(sphere);

	float16_t dither = bayer_32x32(texcoord, vec2(viewWidth, viewHeight));

	for (int i = 0; i < 16; i++) {
		float16_t h = cloud_depth_map(ray.xz);
		//cloud_max += 30.0;
		//cloud_min += 30.0;
		//cloud_half += 3.0;
		//cloud_med += 30.0;
		float16_t b1 = fma(-h, cloud_half, cloud_med);
		float16_t b2 = fma( h, cloud_half, cloud_med);

		f16vec3 sphere_center = f16vec3(0.0, cloud_med - ray.y, 0.0);
		float16_t dist = abs(dot(ray_step, sphere_center));
		float16_t line_to_dot = distance(ray_step * dist, sphere_center);

		if (h == 0.0) h = -0.1667;
		float16_t SDF = min(line_to_dot - cloud_half * h + dist + 6.0 / ray_step.y, 20.0 / ray_step.y);

		SDF = max(SDF, (cloud_min - ray.y) / max(0.001, ray_step.y));

		ray += SDF * ray_step * fma(dither, 0.2, 0.8);

		// Check intersect
		if (h > 0.01 && ray.y > b1 && ray.y < b2) {
			// Step back to intersect
			ray -= (line_to_dot - cloud_half * h + 6.0 / ray_step.y) * ray_step;

			color.a = 1.0;
			break;
		}

		if (ray.y > cloud_max) break;
	}

	if (color.a > 0.0) {
		float16_t sunIllumnation = 1.2 - cloud_depth_map((ray + worldLightPosition * 30.0).xz);
		color.rgb += (0.3 + pow(dotS, 4.0) * 0.7) * sunraw * (1.0 - extShadow) * sunIllumnation * (1.0 - max(cloud_coverage, 0.0)) * dot(nTime, vec4(1.0, 0.1, 1.0, 2.3))* dot(Time, vec4(2.5, 1.6, 2.8, 3.4)) * (1.0 + rainStrength * 3.2);
		color.a = min(1.0, cloud_depth_map((ray + ray_step * 50.0).xz) * 3.0) * smoothstep(0.0, 50.0 * (1.0 + cloud_coverage * 2.0), sphere.y);
		color.rgb *= (mix(0.7 + (ray.y - cloud_med) / cloud_half * 0.47 * (clamp(sphere.y / 80.0, 0.0, 0.5) + 0.5), 1.2, max(0.0, cloud_coverage * 1.3)) + 0.1);// * (1.0 + rainStrength * 0.1);
	}

	return color;
}
#endif

vec3 calc_sky(in vec3 sphere, in vec3 vsphere, in vec3 cam, in vec3 sunraw) {
	vec3 sky = calc_atmosphere(sphere, vsphere);

	float dotS = dot(vsphere, lightPosition);

	vec4 clouds = calc_clouds(sphere - vec3(0.0, cam.y, 0.0), cam, max(dotS, 0.0), sunraw);
	sky = mix(sky, clouds.rgb, clouds.a);

	#if CLOUDS == 3
	vec4 VClouds = volumetric_clouds(sphere - vec3(0.0, cam.y, 0.0), cam, max(dotS, 0.0), sunraw);
	sky = mix(sky, VClouds.rgb, VClouds.a);
	#endif

	return mix(mix(sky, vec3(dot(sky, vec3(1.2))), rain0 *0.76), vec3(0.1, 0.15, 0.25) * 0.15 * (1.0 - Time.w * 0.5), rain0 * (1.0 - dot(sky, vec3(3.3))));
}

vec3 calc_sky_with_sun(in vec3 sphere, in vec3 vsphere, in vec3 sunraw, in vec3 ambientU) {
	vec3 sky = calc_atmosphere(sphere, vsphere);

	float dotS = dot(vsphere, lightPosition);

	float ground_cover = smoothstep(30.0, 60.0, sphere.y - cameraPosition.y);
	sky += suncolor * (pow(smoothstep(0.9962, 0.99998, abs(dotS)), 24.0) * (1.0 - rain0) * (8.0 - 4.0 * Time.w) * ground_cover);
	
	#if CLOUDS >= 1
	#ifdef NEW_2D_CLOUD
	vec3 nwpos = project_uv2skybox(texcoord);

    float mu_s = dot(nwpos, worldLightPosition);
    float mu = abs(mu_s);
	
	float cmie = calc_clouds0(nwpos * 512.0, cameraPosition);

    float opmu2 = 1. + mu*mu;
    float phaseM = .1193662 * (1. - g2) * opmu2 / ((2. + g2) * pow(1. + g2 - 2.*g*mu, 1.5));
    sky += (luma(ambientU) + sunraw * phaseM * 0.2) * cmie;
	#else
	vec4 clouds = calc_clouds(sphere - vec3(0.0, cameraPosition.y, 0.0), cameraPosition, max(dotS, 0.0), sunraw);
	sky = mix(sky, clouds.rgb, clouds.a);
	#endif
	#endif

	#if CLOUDS >= 2
	vec4 VClouds = texture2D(colortex1, texcoord);
	vec4 VClouds1 = texture2DLod(colortex1, texcoord, 1.0);
	vec4 VClouds2 = texture2DLod(colortex1, texcoord, 2.0);
	VClouds.rgb = VClouds.rgb * 0.35f + VClouds1.rgb * 0.5f + VClouds2.rgb * 0.15f;
	VClouds.a = VClouds1.a;
	sky = mix(sky, VClouds.rgb, VClouds.a);
	#endif

	return mix(mix(sky, vec3(dot(sky, vec3(1.2))), rain0 *0.76), vec3(0.1, 0.15, 0.25) * 0.15 * (1.0 - Time.w * 0.5), rain0 * (1.0 - dot(sky, vec3(3.3))));
}

#define CrespecularRays 2 //[0 1 2 3 5 8 99]

#if CrespecularRays > 0
    float rayStrength = float(CrespecularRays);
    float vl_steps = 8.0 * max(0.0,(rayStrength * 2.0 - 1.0));
    int vl_loop = int(vl_steps);

float VL(in vec3 owpos, out float vl) {
	vec3 adj_owpos = owpos - vec3(0.0,1.62,0.0);
	float adj_depth = length(adj_owpos);
	float startRay = 0.2;
	const float increment = 4.0 / 8.0;

	vec3 swpos = owpos;
	float step_length = min(shadowDistance * 2.8, adj_depth) / vl_steps;
	vec3 dir = normalize(adj_owpos) * step_length;
	float prev = 0.0, total = 0.0;

	float dither = bayer_16x16(texcoord, vec2(viewWidth, viewHeight));
	
	startRay += dither * increment;
	float weight = -increment / (startRay - 512.0);


	for (int i = 0; i < vl_loop; i++) {
		swpos -= dir;
		dither = fract(dither + 0.618);
		vec3 shadowpos = wpos2shadowpos(swpos + dir * dither);
		float sdepth = texelFetch2D(shadowtex1, ivec2(shadowpos.st * vec2(shadowMapResolution)), 0).x;

		float hit = float(shadowpos.z + 0.0006 < sdepth);
        if (shadowpos.x < 0.0 || shadowpos.y < 0.0 || shadowpos.x > 1.0 || shadowpos.y > 1.0 || shadowpos.z < 0.0 || shadowpos.z > 1.0) hit = 1.0;

		total += (prev + hit) * step_length * 0.5;

		prev = hit;
	}

	total = min(total, 512.0);
	
	vl = total * weight;

	return (max(0.0, adj_depth - shadowDistance) + total) * weight / 768.0f;
}
#endif

#endif
#endif
