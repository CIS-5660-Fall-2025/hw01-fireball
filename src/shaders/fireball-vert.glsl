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

in vec4 vs_Pos;             // The array of vertex positions passed to the shader

in vec4 vs_Nor;             // The array of vertex normals passed to the shader

in vec4 vs_Col;             // The array of vertex colors passed to the shader.

out vec4 fs_Nor;            // The array of normals that has been transformed by u_ModelInvTr. This is implicitly passed to the fragment shader.
out vec4 fs_LightVec;       // The direction in which our virtual light lies, relative to each vertex. This is implicitly passed to the fragment shader.
out vec4 fs_Col;            // The color of each vertex. This is implicitly passed to the fragment shader.
out vec4 fs_Pos;
out float fs_Heat;

const vec4 lightPos = vec4(5, 5, 3, 1); //The position of our virtual light, which is used to compute the shading of
                                        //the geometry in the fragment shader.

#define PI 3.141592

// From toolbox slides
float bias(float b, float t) {
    return pow(t, log(b) / log(.5));
}

float gain(float g, float t) {
    if(t < 0.5)
        return bias(1.-g, 2.*t) / 2.;
    else
        return 1. - bias(1.-g, 2.-2.*t) / 2.;
}

float cubicPulse(float c, float w, float x) {
    // c - center, w - taper length
    x = abs(x-c);
    if(x > w) return 0.;
    x /= w;
    return 1. - x*x*(3.-2.*x);
}
//

float hash31(vec3 p3) // From https://www.shadertoy.com/view/4djSRW
{
	p3  = fract(p3 * .1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
}

mat3 rotZ(float o) {
    return mat3(cos(o), sin(o), 0., -sin(o), cos(o), 0., 0., 0., 1.);
}

mat3 rotX(float o) {
    return mat3(1., 0., 0., 0., cos(o), sin(o), 0., -sin(o), cos(o));
}

float noise(vec3 p) {
    vec3 lp = fract(p);
    vec3 id = floor(p);

    vec2 d = vec2(1.,0.);

    float r000 = hash31(id+d.yyy);
    float r001 = hash31(id+d.yyx);
    float r010 = hash31(id+d.yxy);
    float r011 = hash31(id+d.yxx);
    float r100 = hash31(id+d.xyy);
    float r101 = hash31(id+d.xyx);
    float r110 = hash31(id+d.xxy);
    float r111 = hash31(id+d.xxx);

    float r00 = mix(r000, r001, lp.z);
    float r01 = mix(r010, r011, lp.z);
    float r10 = mix(r100, r101, lp.z);
    float r11 = mix(r110, r111, lp.z);

    float r0 = mix(r00, r01, lp.y);
    float r1 = mix(r10, r11, lp.y);

    float r = mix(r0, r1, lp.x);

    return r;
}

float fbm(vec3 p) {
    p *= 5.;

    const int iterations = 4;
    mat3 rot = rotX(32.53) * rotZ(18.4) * rotX(41.2);

    float scaleMult = 2.;
    float decay = .5;
    
    float sum = 0.;
    float currMult = .5;

    vec3 q = p;
    for(int i=0; i<iterations; i++) {
        sum += noise(q)*currMult;

        q *= scaleMult;
        q += vec3(13.513,591.,219.);
        q *= rot;
        currMult *= decay;
    }

    return sum;
}

float trigNoise(vec3 p) {
    p *= 0.3;
    return (1.2*sin(p.x*3.4+p.z)*cos(p.y*5.2-p.z*1.34)*cos(p.x*4.2-p.y*1.2))*.5+.5;
}

float topOffset(vec3 p) {
    return 5.*bias(0.001, max(0., 1.-acos(normalize(p).y)/(PI*.5)));
}

// toolbox pulse at the top and pulsing fire
// flicker fire
// moving glow noise
// glow wrt noise
// can make background that new volume ra ymarching and make it glowery firey and make it burn with noise

vec3 modify(vec3 p) {
    vec3 sp = p;
    sp += u_Time * vec3(0.4, -0.8, 0.45);

    float heatOffset = 2.*trigNoise(sp)+fbm(sp);
    fs_Heat = heatOffset;

    float topOffset = topOffset(p);

    float finalOffset = heatOffset + topOffset;
    p += 0.1*finalOffset*fs_Nor.xyz;
    return p;
}

void main()
{
    fs_Col = vs_Col;                         // Pass the vertex colors to the fragment shader for interpolation

    mat3 invTranspose = mat3(u_ModelInvTr);
    fs_Nor = vec4(invTranspose * vec3(vs_Nor), 0);          // Pass the vertex normals to the fragment shader for interpolation.
                                                            // Transform the geometry's normals by the inverse transpose of the
                                                            // model matrix. This is necessary to ensure the normals remain
                                                            // perpendicular to the surface after the surface is transformed by
                                                            // the model matrix.


    vec4 modelposition = u_Model * vs_Pos;   // Temporarily store the transformed vertex positions for use below
    modelposition.xyz = modify(modelposition.xyz);
    fs_Pos = modelposition;

    fs_LightVec = lightPos - modelposition;  // Compute the direction in which the light source lies

    gl_Position = u_ViewProj * modelposition;// gl_Position is a built-in variable of OpenGL which is
                                             // used to render the final positions of the geometry's vertices
}
