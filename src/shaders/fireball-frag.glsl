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
in float fs_Displacement;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.


vec3 getBottomToTopCol(vec3 p, float disp) {
    const vec3 hotCol = vec3(1.5);
    const vec3 topCol = vec3(1., 0.3, 0.);

    float interpo = smoothstep(0., 2., p.y+disp);

    return mix(hotCol, topCol, interpo);
}

vec3 getDisplaceNoiseCol(vec3 p, float disp) {
    return vec3(-1.,0.,0.)+vec3(2.,0.,0.)* smoothstep(0.7, 3., fs_Displacement);
}

float getHotness(vec3 p, float disp) {
    return 2.*smoothstep(1.4, -1., p.y-disp*0.7+1.) + 0.2*(min(2.5,disp)-1.5);
}

vec3 hotnessToCol(float hotness) {
    const vec3 colors[3] = vec3[] (
        vec3(0.),
        vec3(1.,0.3,0.),
        vec3(1.5)
    );

    hotness = clamp(hotness, 0., 1.9999);

    int ind = int(floor(hotness));
    float interpo = fract(hotness);
    const float reps = 5.;
    interpo = floor(interpo*reps)/reps;

    return mix(colors[ind], colors[ind+1], interpo);
}

void main()
{
    vec3 p = fs_Pos.xyz;

    //vec3 col = getDisplaceNoiseCol(p, fs_Displacement) + getBottomToTopCol(p, fs_Displacement);
    vec3 col = hotnessToCol(getHotness(p, fs_Displacement));

    out_Col = vec4(col, 1.);
}
