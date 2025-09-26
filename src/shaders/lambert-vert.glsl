#version 300 es

//This is a vertex shader. While it is called a "shader" due to outdated conventions, this file
//is used to apply matrix transformations to the arrays of vertex data passed to it.
//Since this code is run on your GPU, each vertex is transformed simultaneously.
//If it were run on your CPU, each vertex would have to be processed in a FOR loop, one at a time.
//This simultaneous transformation allows your program to run much faster, especially when rendering
//geometry with millions of vertices.

uniform mat4 u_Model;       // The matrix that defines the transformation of the
                            // object we're rendering. In this assignment,
                            // this will be the result of traversing your scene graph.

uniform mat4 u_ModelInvTr;  // The inverse transpose of the model matrix.
                            // This allows us to transform the object's normals properly
                            // if the object has been non-uniformly scaled.

uniform mat4 u_ViewProj;    // The matrix that defines the camera's transformation.
                            // We've written a static matrix for you to use for HW2,
                            // but in HW3 you'll have to generate one yourself


uniform float u_Time;

uniform float u_ShellHeight;

in vec4 vs_Pos;             // The array of vertex positions passed to the shader

in vec4 vs_Nor;             // The array of vertex normals passed to the shader

in vec4 vs_Col;             // The array of vertex colors passed to the shader.

out vec4 fs_Nor;            // The array of normals that has been transformed by u_ModelInvTr. This is implicitly passed to the fragment shader.
out vec4 fs_LightVec;       // The direction in which our virtual light lies, relative to each vertex. This is implicitly passed to the fragment shader.
out vec4 fs_Col;            // The color of each vertex. This is implicitly passed to the fragment shader.
out vec4 fs_Pos;

const vec4 lightPos = vec4(5, 5, 3, 1); //The position of our virtual light, which is used to compute the shading of
                                        //the geometry in the fragment shader.

// Toolbox Functions

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


// FMB Controls
const float u_Amplitude = 0.2;     // height scale, e.g. 1.0
const float u_Gain =0.5;          // amplitude multiplier per octave, e.g. 0.5
const vec2  u_Offset = vec2(0.0);        // XY offset into noise, e.g. vec2(0.0)
const float u_NormalEps = 0.01;     // small step for FD normals, e.g. 0.01 (set 0 to skip)

float random21(vec2 xy) {
    vec2 rand = vec2(
        fract(sin(dot(xy ,vec2(12.9898, 78.233))) * 43758.5453),
        fract(sin(dot(xy ,vec2(14.7921, 48.012))) * 39476.4739)
    );
    return fract(rand.x * rand.y);
}

float smoothstep3(float t) {
    return 3.0 * t * t - 2.0 * t * t * t;
}

float fbm(vec2 uv) {
    float freq = 1.0;
    float amplitude = 0.5;
    float sum = 0.0;
    const int octaves = 5;
    for (int i = 0; i < octaves; i++) {
        sum += amplitude * random21(uv * freq);
        freq *= 2.0;
        amplitude *= 0.5;
    }
    return sum;
}

float getNewHeight(vec2 xz) {
    // get coordinates to index into noise at
    const vec2 offset = vec2(1.3, 5.12);
    vec2 uv = xz * 2.0 + offset;
    return fbm(uv);
}

float calcRadius(float x, float z) {
    return pow(pow(x, 2.0) + pow(z, 2.0), 0.5);
}

void main()
{
    fs_Col = vs_Col;                         // Pass the vertex colors to the fragment shader for interpolation

    vec4 newPos = vs_Pos;

    // only alter top
    if (newPos.y > 0.0) {
        float oldHeight = vs_Pos.y;
        const float freq = 4.0;
        float offset = u_Time / 50.0;
        float lowFreqNoise = sin(2.0 * freq * newPos.x + offset) + sin(4.0 * freq * newPos.z + offset) + cos(5.0 * freq * newPos.x + offset) + sin(3.0 * freq * newPos.y + offset);
        float newHeight = vs_Pos.y + getNewHeight(vs_Pos.xz + sin(u_Time / 20.0)) + lowFreqNoise;
        newHeight /= 2.0;

        // blend old and new heights
        float blendedH = mix(oldHeight, newHeight, .1);
        float radius = clamp(length(vs_Pos.xz), 0.0, 1.0);
        float mixConst = bias(.2, 1.0 - radius);
        blendedH = mix(oldHeight, blendedH, .99);

        // stretch
        blendedH *= 2.0;

        // don't go out the bottom
        if (blendedH < -oldHeight + 0.1) {
            blendedH = -oldHeight + 0.1;
        }
        newPos.y = blendedH / 2.0 * u_ShellHeight;

    } else {
        newPos.y *= 0.6;
    }


    fs_Pos = newPos;
    mat3 invTranspose = mat3(u_ModelInvTr);
    fs_Nor = vec4(invTranspose * vec3(vs_Nor), 0);          // Pass the vertex normals to the fragment shader for interpolation.
                                                            // Transform the geometry's normals by the inverse transpose of the
                                                            // model matrix. This is necessary to ensure the normals remain
                                                            // perpendicular to the surface after the surface is transformed by
                                                            // the model matrix.


    vec4 modelposition = u_Model * newPos;   // Temporarily store the transformed vertex positions for use below

    fs_LightVec = lightPos - modelposition;  // Compute the direction in which the light source lies

    gl_Position = u_ViewProj * modelposition;// gl_Position is a built-in variable of OpenGL which is
                                             // used to render the final positions of the geometry's vertices
}