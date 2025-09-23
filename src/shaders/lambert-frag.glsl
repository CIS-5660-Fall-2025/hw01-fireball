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

uniform float u_HueOffset;

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;
in vec4 fs_Pos;
in float fs_Displacement;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.

vec3 rand(vec3 seed) {
    return normalize(vec3(
        // from book of shaders with modified constants
        fract(sin(dot(seed, vec3(1667.7891, 9397.1234, 7607.5102))) * 104639.1111),
        fract(sin(dot(seed, vec3(4969.1234, 8009.5510, 8963.2002))) * 660949.1020),
        fract(sin(dot(seed, vec3(5657.1929, 1847.1999, 5791.4010))) * 714377.1491)
    ) * 2. - 1.);
}

float perlinInterp(float t) {
    return t * t * t * (t * (t * 6. - 15.) + 10.);
}

float perp(float x, float y, float a) {
    return mix(x, y, perlinInterp(fract(a)));
}

float perlin(vec3 pos) {
    float fx = floor(pos.x);
    float fy = floor(pos.y);
    float fz = floor(pos.z);

    float cx = ceil(pos.x);
    float cy = ceil(pos.y);
    float cz = ceil(pos.z);

    vec3 blb = vec3(fx, fy, fz);
    vec3 blt = vec3(fx, fy, cz);
    vec3 brb = vec3(fx, cy, fz);
    vec3 brt = vec3(fx, cy, cz);
    vec3 flb = vec3(cx, fy, fz);
    vec3 flt = vec3(cx, fy, cz);
    vec3 frb = vec3(cx, cy, fz);
    vec3 frt = vec3(cx, cy, cz);

    float blbI = dot(rand(blb), pos - blb);
    float bltI = dot(rand(blt), pos - blt);
    float brbI = dot(rand(brb), pos - brb);
    float brtI = dot(rand(brt), pos - brt);
    float flbI = dot(rand(flb), pos - flb);
    float fltI = dot(rand(flt), pos - flt);
    float frbI = dot(rand(frb), pos - frb);
    float frtI = dot(rand(frt), pos - frt);

    return perp(
        perp(
            perp(blbI, bltI, pos.z),
            perp(brbI, brtI, pos.z),
            pos.y
        ),
        
        perp(
            perp(flbI, fltI, pos.z),
            perp(frbI, frtI, pos.z),
            pos.y
        ),
        pos.x
    ) * 0.5 + 0.5;
}

vec3[] quasiblackbody = vec3[7](
    vec3(0.1, 0., 0.),
    vec3(0.9, 0.1, 0.),
    vec3(0.99, 0.9, 0.1),
    vec3(1., 1., 1.),
    vec3(0.2, 0.9, 1.),
    vec3(0., 0.3, 1.),
    vec3(0., 0., 0.4)
);

float sineEase(float t) {
    return 1. - (cos(t * 3.1415926) + 1.) / 2.;
}

vec3 hsvshift(vec3 orig, float dh) {
    float cmax = max(max(orig.r, orig.g), orig.b);
    float cmin = min(min(orig.r, orig.g), orig.b);
    float range = cmax - cmin;

    float h = 0.;
    if (range > 0.) {
        if (cmax == orig.r) {
            h = (orig.g - orig.b) / range;
            if (h < 0.) h += 6.;
        } else if (cmax == orig.g) {
            h = (orig.b - orig.r) / range + 2.;
        } else {
            h = (orig.r - orig.g) / range + 4.;
        }
        h /= 6.;
    }

    float s = cmax == 0. ? 0. : range / cmax;
    float v = cmax;

    h = mod(h + dh, 1.);

    float c = v * s;
    float x = c * (1. - abs(mod(h * 6., 2.) - 1.));
    float m = v - c;

    vec3 p;
    float hp = h * 6.;
    if (hp <= 1.) {
        p = vec3(c, x, 0.);
    } else if (hp <= 2.) {
        p = vec3(x, c, 0.);
    } else if (hp <= 3.) {
        p = vec3(0., c, x);
    } else if (hp <= 4.) {
        p = vec3(0., x, c);
    } else if (hp <= 5.) {
        p = vec3(x, 0., c);
    } else {
        p = vec3(c, 0., x);
    }
    return p + m;
}

void main()
{
    // Material base color (before shading)
    // vec4 diffuseColor = u_Color;

    vec3 col1 = quasiblackbody[clamp(int(floor(fs_Displacement)), 0, 6)];
    vec3 col2 = quasiblackbody[clamp(int(ceil(fs_Displacement)), 0, 6)];

    vec3 lincol1 = vec3(pow(col1.r, 1./2.2), pow(col1.g, 1./2.2), pow(col1.b, 1./2.2));
    vec3 lincol2 = vec3(pow(col2.r, 1./2.2), pow(col2.g, 1./2.2), pow(col2.b, 1./2.2));

    vec3 linInterpCol = mix(lincol1, lincol2, sineEase(fract(fs_Displacement)));

    vec3 interpCol = vec3(pow(linInterpCol.r, 2.2), pow(linInterpCol.g, 2.2), pow(linInterpCol.b, 2.2));

    vec3 col = hsvshift(interpCol, u_HueOffset);

    out_Col = vec4(col, 1.); 

    // // diffuseColor += vec4(perlin(fs_Pos.xyz * 16.) * vec3(1., 0.4, 0.1), 1.);

    // // Calculate the diffuse term for Lambert shading
    // float diffuseTerm = dot(normalize(fs_Nor), normalize(fs_LightVec));
    // // Avoid negative lighting values
    // // diffuseTerm = clamp(diffuseTerm, 0, 1);

    // float ambientTerm = 0.2;

    // float lightIntensity = diffuseTerm + ambientTerm;   //Add a small float value to the color multiplier
    //                                                     //to simulate ambient lighting. This ensures that faces that are not
    //                                                     //lit by our point light are not completely black.

    // // Compute final shaded color
    // out_Col = vec4(diffuseColor.rgb * lightIntensity, diffuseColor.a);
}
