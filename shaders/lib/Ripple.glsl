/***************************************************************************************
	"voronoi rain splashes" by Proe - 2016
	License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
	Contact: None
	Website: https://www.shadertoy.com/view/4ldSRj
***************************************************************************************/

#define ITERATIONS 3
#define RIPPLES_SPEED 2.625

// - hash from https://www.shadertoy.com/view/4djSRW
vec3 hash(vec3 position){
	position = fract(position * vec3(0.1031, 0.1030, 0.0973));
    position += dot(position, position.yxz + 19.19);
    return fract((position.xxy + position.yxx) * position.zyx);

}

float bias(float signal, float b)
{
    return signal / ((((1.0/b) - 2.0)*(1.0 - signal))+1.0);
}

vec3 voronoi(vec3 position, float rnd)
{
    vec3 vw, xy, yz, xz, s1, s2, xx, bz, az, xw;

    yz = vec3(0.0);
    bz = vec3(0.0);
    az = vec3(0.0);
    xw = vec3(0.0);

    position = position.xzy;
    position *= 3.0f;

    vec3 uv2 = position;
    vec3 p2 = position;
   	position = vec3(floor(position));  
	
	float timer = frametime * RIPPLES_SPEED;
    
    vec2 yx = vec2(0.0);


                        
            for (int j = -1; j <= 1;j++)
            {
                for (int k = -1; k <= 1; k++)
                {

                    vec3 offset = vec3(j, k, 0.0);
                    //grab random values for grid
                    s1.xz = hash(position + offset.xyz + 127.43 + rnd).xz;

                    //uses random value as timer for switching positions of raindrop
                    s2.xz = floor(s1.xx + timer);

                    //adding the timer to the random value so that everytime a ripple fades, a new drop appears
                    xz.xz = hash(position + offset.xyz + s2 + rnd).xz;
                    xx = hash(position + offset.xyz + (s2 - 1.0));

                    

                    //test2 = xy;

                    // modulate the timer
                    s1 = mod(s1 + timer, 1.0);
					p2 = mod(p2, 1.0);
                    
                    //create opacity
                    float op = 1.0 - s1.x ;
                    op = bias(op, 0.21);

                    //change the profile of the timer
                    s1.x = bias(s1.x, 0.62);

                    // expand ripple over time
                    float size = mix(4.0, 1.0, s1.x);

                    // move the ripple formation from the center as it grows
                    float size2 = mix(0.005, 2.0, s1.x);

                    // make the voronoi 'balls'
                    xy.xz = vec2(length((position.xy + xz.xz) - (uv2.xy - offset.xy)) * size);

                    xx = vec3(length((p2) + xz) - (uv2 - offset) * 1.30);
                    xx = 1.0 - xx;

                    // invert
                    xy.x = 1.0 - xy.x;
                    xy.x *= size2;

                    //create first ripple
                    if(xy.x > 0.5) xy.x = mix(1.0, 0.0, xy.x);
                    xy.x = mix(0.0, 2.0, xy.x);

                    // second ripple
                    if(xy.x > 0.5) xy.x = mix(1.0, 0.0, xy.x);
                    xy.x = mix(0.0, 2.0, xy.x);

                    xy.x = smoothstep(0.0, 1.0, xy.x);

                    // fade ripple over time
                    xy *= op;

                    yz = 1.0 - ((1.0 - yz) * (1.0 - xy));
                }
            }
         
    
    return vec3(yz * 0.1);
}

float GetRipples(vec3 position, in float wet){
    float pl = (position.y + 1.0);
    vec3 ripples = vec3(0.0);
    
    for (int i = 0; i < ITERATIONS; i++){
		ripples += voronoi(position, float(i + 1));
    }
	
	return (pl - ripples.x * 0.25) * wet * rain0;
}

vec3 GetRipplesNormal(vec3 position, in float wet) {

	if (rain0 < 0.01)
	{
		return vec3(0.0, 0.0, 1.0);
	}

	const float ripplesHeight = 0.875f;

	position -= vec3(0.005f, 0.0f, 0.005f);

	float ripplesCenter = GetRipples(position, wet);
	float ripplesLeft = GetRipples(position + vec3(0.01f, 0.0f, 0.0f), wet);
	float ripplesUp   = GetRipples(position + vec3(0.0f, 0.0f, 0.01f), wet);

	vec3 ripplesNormal;
		 ripplesNormal.r = ripplesCenter - ripplesLeft;
		 ripplesNormal.g = ripplesCenter - ripplesUp;
		 ripplesNormal.r *= 20.0f * ripplesHeight;
		 ripplesNormal.g *= 20.0f * ripplesHeight;
		 ripplesNormal.b = 1.0;
		 ripplesNormal.rgb = normalize(ripplesNormal.rgb);


	return ripplesNormal.rgb;
}