#version 300 es

// This is a fragment shader. If you've opened this file first, please
// open and read lambert.vert.glsl before reading on.
// Unlike the vertex shader, the fragment shader actually does compute
// the shading of geometry. For every pixel in your program's output
// screen, the fragment shader is run for every bit of geometry that
// particular pixel overlaps. By implicitly interpolating the position
// data passed into the fragment shader by the vertex shader, the fragment shader
// can compute what color to apply to its pixel based on things like vertex
// position, light position, and vertex color.
precision highp float;

uniform vec4 u_Color; // The color with which to render this instance of geometry.
uniform float u_Time;

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;
in vec4 fs_Pos;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.

///

vec3 hash33(vec3 p3) // From https://www.shadertoy.com/view/4djSRW
{
	p3 = fract(p3 * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yxz+33.33);
    return fract((p3.xxy + p3.yxx)*p3.zyx);
}

vec3 randomMove(vec3 param, float t) { // ~ [0, 1]
    vec3 spd = vec3(.7, 1., .4) + 0.2*param;
    vec3 off = param*vec3(418.23,856.59,192.50);
    return sin(t*spd+off)*.5+.5;
}

vec3 voronoi(vec3 p) {
    p *= 2.8;

    vec3 op = p;

    p += 0.75*normalize(p)*(sin(u_Time*.75)*.5+.5);
    p += 0.1*u_Time*vec3(0.2, 0.1, 0.25);

    float moveT = 0.4*u_Time;

    #define COLOR_COUNT 5
    const vec3 colors[COLOR_COUNT] = vec3[] (
        vec3(.290, .125, .250),
        vec3(.866, .741, .835),
        vec3(.674, .623, .733),
        vec3(.611, 1., .980),
        vec3(.964, .0623, .404)
    );

    const float gridSize = 0.42;
    
    vec3 cellPos = floor(p/gridSize)*gridSize;
    vec3 lp = p-cellPos;

    float currMinDist = -1.;
    float currColSeed = 0.;
    vec3 closestOrb = vec3(0.);

    for(int x=-1; x<=1; x++) {
        for(int y=-1; y<=1; y++) {
            for(int z=-1; z<=1; z++) {
                vec3 cellOffset = vec3(x, y, z)*gridSize;
                vec3 currCellPos = cellPos + cellOffset;
                vec3 currOrbPos = randomMove(hash33(currCellPos), moveT)*gridSize; // Turn into time change params
                float colSeed = hash33(currCellPos*20.).x;

                float dist = length(lp-(cellOffset + currOrbPos));
                if(currMinDist < 0. || dist < currMinDist) {
                    currMinDist = dist;
                    closestOrb = currCellPos + currOrbPos;
                    currColSeed = colSeed;
                }
            }
        }
    }

    // Second loop to get the sdf of planes
    float d = 1000.0;

    for(int x=-2; x<=2; x++) {
        for(int y=-2; y<=2; y++) {
            for(int z=-2; z<=2; z++) {
                vec3 cellOffset = vec3(x, y, z)*gridSize;
                vec3 currCellPos = cellPos + cellOffset;
                vec3 currOrbPos = randomMove(hash33(currCellPos), moveT)*gridSize; // Turn into time change params

                vec3 currOrbWorldPos = currCellPos + currOrbPos;
                vec3 diff = closestOrb - currOrbWorldPos;
                if(dot(diff, diff) > gridSize*0.001) { // Skip closest orb
                    vec3 dir = normalize(diff);
                    vec3 center = currOrbWorldPos + diff*.5;
                    d = min(d, dot(p-center, dir));
                }

            }
        }
    }

    // Use the distance to voronoi border for effects
    d = max(0.0001, d);
    // float repLen = 0.07;
    // float stripeFac = 0.2;
    // float ld = mod(d, repLen) - repLen*.5;
    // ld = abs(ld) - repLen*.5*stripeFac;
    // float stripeExists = step(ld, 0.);

    float exists = step(0.025, d) * step(d, 0.039) + step(0.065, d);
    
    currColSeed *= float(COLOR_COUNT);
    currColSeed = min(float(COLOR_COUNT)-0.0001, currColSeed);
    int colIndex = int(floor(currColSeed));
    vec3 col = colors[colIndex];

    float atten = min(1., d*8.)+min(1.,0.01/d);
    //atten -= stripeExists*.2;

    // Additional Glow Highlight
    atten += min(4., 0.1/(2.*currMinDist));

    // Pulsing
    float r = length(op)-.1*u_Time;
    r += cos(0.1*op.x*op.y*1.8+0.1*op.z*0.9+op.x*op.z*2.*0.2+op.y*1.4*0.2);
    float repr = 2.;
    float lr = abs(mod(r, repr) - repr*.5);
    atten *= 0.8+1.6*smoothstep(0.7, 0.3, lr);

    // Near End Darkening
    atten *= .6+.4*smoothstep(3., 2.4, length(op));

    atten *= 0.8*0.6;

    return vec3(col*exists*atten);
}

vec3 sampleCol(vec3 p) {
    return u_Color.rgb*voronoi(p);
}
///

void main()
{
    // Material base color (before shading)
        vec4 diffuseColor = vec4(0.);//vec4(sampleCol(fs_Pos.xyz),1.)*u_Color;

        // Calculate the diffuse term for Lambert shading
        float diffuseTerm = dot(normalize(fs_Nor), normalize(fs_LightVec));
        // Avoid negative lighting values
        // diffuseTerm = clamp(diffuseTerm, 0, 1);

        float ambientTerm = 0.2;

        float lightIntensity = diffuseTerm + ambientTerm;   //Add a small float value to the color multiplier
                                                            //to simulate ambient lighting. This ensures that faces that are not
                                                            //lit by our point light are not completely black.

        // Compute final shaded color
        out_Col = vec4(sampleCol(fs_Pos.xyz), 1.);//vec4(diffuseColor.rgb * lightIntensity, diffuseColor.a);
}
