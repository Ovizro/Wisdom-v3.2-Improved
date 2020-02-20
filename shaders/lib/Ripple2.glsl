vec3 GetRainAnimationTex(sampler2D tex, vec2 uv, float wet)
{
	//float frame = mod(floor(float(frameCounter) * 1.0), 60.0);
	// frame = 0.0;

	float frame = mod(floor(frametime * 60.0), 60.0);
	vec2 coord = vec2(uv.x, mod(uv.y / 60.0, 1.0) - frame / 60.0);

	vec3 n = fma(texture2D(tex, coord).rgb, vec3(2.0f), vec3(-1.0f));
	n.y *= -1.0;

	n.xy = pow(abs(n.xy) * 1.0, vec2(fma((wet * wet * wet), -1.2f, 2.0f))) * sign(n.xy);
	// n.xy = pow(abs(n.xy) * 1.0, vec2(1.0)) * sign(n.xy);

	return n;
}

vec3 BilateralRainTex(sampler2D tex, vec2 uv, float wet)
{
	vec3 n = GetRainAnimationTex(tex, uv.xy, wet);
	vec3 nR = GetRainAnimationTex(tex, fma(vec2(1.0, 0.0), vec2(1.0f / 128.0f), uv.xy), wet);
	vec3 nU = GetRainAnimationTex(tex, fma(vec2(0.0, 1.0), vec2(1.0f / 128.0f), uv.xy), wet);
	vec3 nUR = GetRainAnimationTex(tex, fma(vec2(1.0, 1.0), vec2(1.0f / 128.0f), uv.xy), wet);

	vec2 fractCoord = fract(uv.xy * 128.0);

	vec3 lerpX = mix(n, nR, fractCoord.x);
	vec3 lerpX2 = mix(nU, nUR, fractCoord.x);
	vec3 lerpY = mix(lerpX, lerpX2, fractCoord.y);

	return lerpY;
}

vec3 GetRainNormal(in vec3 pos, inout float wet)
{
	if (rain0 < 0.01)
	{
		return vec3(0.0, 0.0, 1.0);
	}

	pos.xyz *= 0.5;

	#if RAIN_SPLASH_GUALITY == high
	vec3 n1 = BilateralRainTex(gaux1, pos.xz, wet);
	vec3 n2 = BilateralRainTex(gaux2, pos.xz, wet);
	vec3 n3 = BilateralRainTex(gaux3, pos.xz, wet);
	#else
	vec3 n1 = GetRainAnimationTex(gaux1, pos.xz, wet);
	vec3 n2 = GetRainAnimationTex(gaux2, pos.xz, wet);
	vec3 n3 = GetRainAnimationTex(gaux3, pos.xz, wet);
	#endif

	pos.x -= frametime * 1.5;
	float downfall = texture2D(noisetex, pos.xz * 0.0025).x;
	downfall = saturate(fma(downfall, 1.0f, -0.25f));


	vec3 n = n1 * 2.0;
	n += n2 * saturate(downfall * 2.0) * 2.0;
	n += n3 * saturate(fma(downfall, 2.0f, -1.0f)) * 2.0;
	// n = n3 * 3.0;

	n *= 0.3;

	float lod = dot(abs(fwidth(pos.xyz)), vec3(1.0));

	n.xy *= 1.0 / fma(lod, 5.0f, 1.0f);

	// n.xy /= wet + 0.1;
	// n.x = downfall;

	wet = saturate(fma(downfall, ((1.0 - wet) * 0.95), wet));
	// wet = downfall * 0.2 + 0.8;

	n.xy *= rain0;
	return n;
}