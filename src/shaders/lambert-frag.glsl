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

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;
in vec4 fs_Pos;

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

void main()
{
    // Material base color (before shading)
        vec4 diffuseColor = u_Color;

        diffuseColor += vec4(perlin(fs_Pos.xyz * 16.) * vec3(1., 0.4, 0.1), 1.);

        // Calculate the diffuse term for Lambert shading
        float diffuseTerm = dot(normalize(fs_Nor), normalize(fs_LightVec));
        // Avoid negative lighting values
        // diffuseTerm = clamp(diffuseTerm, 0, 1);

        float ambientTerm = 0.2;

        float lightIntensity = diffuseTerm + ambientTerm;   //Add a small float value to the color multiplier
                                                            //to simulate ambient lighting. This ensures that faces that are not
                                                            //lit by our point light are not completely black.

        // Compute final shaded color
        out_Col = vec4(diffuseColor.rgb * lightIntensity, diffuseColor.a);
}
