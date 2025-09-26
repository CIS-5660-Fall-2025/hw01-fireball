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
uniform float u_swayLevel;

in vec4 vs_Pos;             // The array of vertex positions passed to the shader

in vec4 vs_Nor;             // The array of vertex normals passed to the shader

in vec4 vs_Col;             // The array of vertex colors passed to the shader.

out vec3 fs_Nor;            // The array of normals that has been transformed by u_ModelInvTr. This is implicitly passed to the fragment shader.
out vec4 fs_LightVec;       // The direction in which our virtual light lies, relative to each vertex. This is implicitly passed to the fragment shader.
out vec4 fs_Col;            // The color of each vertex. This is implicitly passed to the fragment shader.
out vec3 fs_Pos;


float random3(vec3 st) {
    return fract(sin(dot(st, vec3(12.9898,78.233, 37.719))) * 43758.5453123);
}

float value3D(vec3 st) {
    vec3 i = floor(st);
    vec3 f = fract(st);

    // cube
    float a = random3(i);
    float b = random3(i + vec3(1.0, 0.0, 0.0));
    float c = random3(i + vec3(0.0, 1.0, 0.0));
    float d = random3(i + vec3(1.0, 1.0, 0.0));
    float e = random3(i + vec3(0.0, 0.0, 1.0));
    float f1 = random3(i + vec3(1.0, 0.0, 1.0));
    float g = random3(i + vec3(0.0, 1.0, 1.0));
    float h = random3(i + vec3(1.0, 1.0, 1.0));

    // hermite
    vec3 u = f * f * (3.0 - 2.0 * f);

    float x1 = mix(a, b, u.x);
    float x2 = mix(c, d, u.x);
    float x3 = mix(e, f1, u.x);
    float x4 = mix(g, h, u.x);

    float y1 = mix(x1, x2, u.y);
    float y2 = mix(x3, x4, u.y);

    return mix(y1, y2, u.z);
}

vec3 randomGradient(vec3 p) {
    float x = fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
    float y = fract(sin(dot(p, vec3(269.5,183.3,246.1))) * 43758.5453);
    float z = fract(sin(dot(p, vec3(113.5,271.9,124.6))) * 43758.5453);
    return normalize(vec3(x - 0.5, y - 0.5, z - 0.5));
}

float perlin3D(vec3 st) {
    vec3 i = floor(st);
    vec3 f = fract(st);
    
    vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

    // 8 corners
    float n000 = dot(randomGradient(i + vec3(0,0,0)), f - vec3(0,0,0));
    float n100 = dot(randomGradient(i + vec3(1,0,0)), f - vec3(1,0,0));
    float n010 = dot(randomGradient(i + vec3(0,1,0)), f - vec3(0,1,0));
    float n110 = dot(randomGradient(i + vec3(1,1,0)), f - vec3(1,1,0));
    float n001 = dot(randomGradient(i + vec3(0,0,1)), f - vec3(0,0,1));
    float n101 = dot(randomGradient(i + vec3(1,0,1)), f - vec3(1,0,1));
    float n011 = dot(randomGradient(i + vec3(0,1,1)), f - vec3(0,1,1));
    float n111 = dot(randomGradient(i + vec3(1,1,1)), f - vec3(1,1,1));

    // interpolate
    float nx00 = mix(n000, n100, u.x);
    float nx10 = mix(n010, n110, u.x);
    float nx01 = mix(n001, n101, u.x);
    float nx11 = mix(n011, n111, u.x);

    float nxy0 = mix(nx00, nx10, u.y);
    float nxy1 = mix(nx01, nx11, u.y);

    return mix(nxy0, nxy1, u.z);
}

float customFBM(vec3 st) {
    
    float speed = 0.0005;
    // LEVEL 1
    float freq = 1.;
    float amp = 3.; 
    vec3 seed = vec3(st.xy, st.z + u_Time * speed) * freq;
    float baseNoise1 =  perlin3D(seed);
    baseNoise1 = baseNoise1 * .5 + .5; // 0 to 1
    baseNoise1 *= amp;
    
    // LEVEL 2
    speed *= 10.;
    freq *= 2.0;
    amp *= 0.1;
    seed = vec3(st.yz, st.x + u_Time * speed) * freq;
    float Noise2 = 0.;//perlin3D(seed) * amp;



    return baseNoise1 + Noise2;
}

float getBias(float time, float bias)
{
  return (time / ((((1.0/bias) - 2.0)*(1.0 - time))+1.0));
}

void main() {
    vec3 lightPos = normalize(vec3(0.0, 10.0, 10.0));
    
    // pos
    vec4 localPos = vs_Pos;
    // offsets -----------------
    
    // general stretch in upper dir
    localPos.y += vs_Nor.y * customFBM(localPos.xyz) * max(0., localPos.y);

    float swayTime = sin(u_Time * 0.005 + localPos.y) * 0.5 + 0.5;
    swayTime = getBias(swayTime, 0.7);
    localPos.xz += swayTime * - u_swayLevel * max(- u_swayLevel - 0.1, localPos.y);
    
    fs_Pos = localPos.xyz;
    float inset = vs_Pos.y * 0.5;
    localPos.xyz -= vs_Nor.xyz * inset;

    // end of offsets -------------
    // nor
    mat3 invTranspose = mat3(u_ModelInvTr);
    fs_Nor = invTranspose * vec3(vs_Nor);  
  
    vec4 modelposition = u_Model * localPos; 
    
    gl_Position = u_ViewProj * modelposition;
}