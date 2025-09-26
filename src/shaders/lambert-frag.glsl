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

uniform float u_ShellHeight;
uniform vec4 u_ShellColors[7];

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;
in vec4 fs_Pos;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.

float bias (float b, float t) {
    return pow(t, log(b) / log(0.5));
}

float gain (float g, float t) {
    if (t < 0.5) {
        return bias(1.0 - g, 2.0 * t) / 2.0;
    } else {
        return 1.0 - bias(1.0 - g, 2.0 - 2.0 * t) / 2.0;
    }
}

vec4 getBaseCol(float y) {
    
    float height = u_ShellHeight; // max height of vertices for color cutoffs
    const int numColors = 8;
    
    const float cutOffs[numColors] = float[numColors](-100.0, -0.2, -0.1, 0.1, 0.3, 0.6, 1.0, 100.0);

    float freq = 0.4;
    float scale = 0.03 * height;
    float t = u_Time / 100.0;
    
    // get which color blend we should be using
    for (int i = 0; i < numColors - 1; i++) {
        //vary cutoffs with time
        float prevVar = scale * sin(t * freq + 2.573 * float(i));
        float nextVar = scale * sin(t * freq + 2.176 * float(i));

        float prevCut = cutOffs[i] * height + prevVar;
        float nextCut = cutOffs[i + 1] * height + nextVar;

        if (y <= nextCut) {
            // get blended color
            float b = clamp((y - prevCut) / (nextCut - prevCut), 0.0, 1.0);
            b = gain(0.8, b);
            if (i - 1 < 0) {
                return mix(vec4(1.0, 0.937, 0.780, 1.0), u_ShellColors[0], b);
            }
            return mix(u_ShellColors[i - 1], u_ShellColors[i], b);
        }
    }
    return u_ShellColors[numColors - 2];
}

void main()
{
    // Material base color (before shading)
        vec4 diffuseColor = u_Color;

        // Calculate the diffuse term for Lambert shading
        float diffuseTerm = dot(normalize(fs_Nor), normalize(fs_LightVec));
        // Avoid negative lighting values
        diffuseTerm = clamp(diffuseTerm, 0.0, 1.0);

        float ambientTerm = 0.2;

        float lightIntensity = diffuseTerm + ambientTerm;   //Add a small float value to the color multiplier
                                                            //to simulate ambient lighting. This ensures that faces that are not
                                                            //lit by our point light are not completely black.

        vec4 baseCol = getBaseCol(fs_Pos.y);

        out_Col = vec4(baseCol.rgb * lightIntensity, baseCol.a);
}