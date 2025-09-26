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
uniform float u_Tail;
uniform float u_FrameRate;

in vec4 vs_Pos;             // The array of vertex positions passed to the shader

in vec4 vs_Nor;             // The array of vertex normals passed to the shader

in vec4 vs_Col;             // The array of vertex colors passed to the shader.

out vec4 fs_Nor;            // The array of normals that has been transformed by u_ModelInvTr. This is implicitly passed to the fragment shader.
out vec4 fs_LightVec;       // The direction in which our virtual light lies, relative to each vertex. This is implicitly passed to the fragment shader.
out vec4 fs_Col;            // The color of each vertex. This is implicitly passed to the fragment shader.
out vec4 fs_Pos;            // position of each vertex, implicitly passed to the grament shader
out float fs_Disp;           // brownian and sinusoidal displacement of vertex

const vec4 lightPos = vec4(5, 5, 3, 1); //The position of our virtual light, which is used to compute the shading of
                                        //the geometry in the fragment shader.
const float PI = 3.1415926;

float sin3D(vec3 x, float freq, float amp, float phase)
{
    return amp * ((sin(x.x * freq + phase ) + sin(x.y * freq + phase) + sin(x.z * freq + phase)) ) / 3.0;
}

float cos3D(vec3 x, float freq, float amp,  float phase)
{
    return amp * (cos(x.x * freq + phase) + cos(x.y * freq + phase) + cos(x.z * freq + phase)) / 3.0;
}

// START functions from https://www.shadertoy.com/view/lllSWr
const mat3 m = mat3( 0.00,  0.80,  0.60,
           		    -0.80,  0.36, -0.48,
             		-0.60, -0.48,  0.64 );

float hash( float n ) {
    return fract(sin(n)*43758.5453);
}

float noise( in vec3 x ) { // in [0,1]
    vec3 p = floor(x);
    vec3 f = fract(x);

    f = f*f*(3.-2.*f);

    float n = p.x + p.y*57. + 113.*p.z;

    float res = mix(mix(mix( hash(n+  0.), hash(n+  1.),f.x),
                        mix( hash(n+ 57.), hash(n+ 58.),f.x),f.y),
                    mix(mix( hash(n+113.), hash(n+114.),f.x),
                        mix( hash(n+170.), hash(n+171.),f.x),f.y),f.z);
    return res;
}

float fbm( vec3 p ) { // in [0,1]
    float f;
    float d_time = ceil(u_Time * u_FrameRate * 0.01);
    f  = 0.4980*noise( p ); p = m*p*1.5 + d_time;
    f  = 0.0020*noise( p ); p = m*p*2.5 + d_time;
    f += 0.2500*noise( p ); p = m*p*0.3 + d_time;
    f += 0.1250*noise( p ); p = m*p*2.01;
    f += 0.0625*noise( p );
    return f;
}
// END

float smootherstep(float edge0, float edge1, float x) {
    x = clamp((x - edge0)/(edge1 - edge0), 0.0, 1.0);
    return x*x*x*(x*(x*6.0 - 15.0) + 10.0);
}

void main()
{
    fs_Col = vs_Col;                         // Pass the vertex colors to the fragment shader for interpolation
    fs_Pos = vs_Pos;

    float freq = 3.0;

    mat3 invTranspose = mat3(u_ModelInvTr);
    fs_Nor = vec4(invTranspose * vec3(vs_Nor), 0);          // Pass the vertex normals to the fragment shader for interpolation.
                                                            // Transform the geometry's normals by the inverse transpose of the
                                                            // model matrix. This is necessary to ensure the normals remain
                                                            // perpendicular to the surface after the surface is transformed by
                                                            // the model matrix.


    vec4 modelposition = u_Model * vs_Pos;   // Temporarily store the transformed vertex positions for use below
    vec3 modelposition3 = vec3(modelposition.x,
                                modelposition.y,
                                modelposition.z);
    fs_LightVec = lightPos - modelposition;  // Compute the direction in which the light source lies
    
    // sinusoidal weight functions
    // float amp_1 = 0.0;
    // float freq_1 = 3.0;
    // float lvl_1 = cos3D(modelposition3, freq_1, amp_1);
    
  
    float amp_1 = 1.0;
    float freq_1 = 2.5;
    float lvl_1 = sin3D(modelposition3, freq_1, amp_1, 1.5*PI);

    float amp_2 = 1.0;
    float freq_2 = 3.0;
    float lvl_2 = sin3D(modelposition3, freq_2, amp_2, 0.1 * PI);

    float amp_3 = 1.0;
    float freq_3 = 1.5;
    float lvl_3 = sin3D(modelposition3, freq_3, amp_3, PI / 3.0);
    
    float amp_4 = 1.0;
    float lvl_noise = fbm(modelposition3) * amp_4;

    float flametails = lvl_noise * clamp(lvl_1, 0.1, 0.8);
    flametails = flametails + lvl_noise * 10.0 * (clamp(lvl_2, 0.4, 2.0) - 0.5);
    flametails = flametails +lvl_noise* clamp(lvl_3, 0.0, 1.0);

    // float disp = (lvl_1 + lvl_2 + lvl_3 + lvl_noise) / (amp_1 + amp_2 + amp_3 + amp_4); // normalized
    float disp = flametails;
    fs_Disp = disp / 3.0;

    // displacing with range [-0.5 to 0.5]
    // disp = disp - 0.5;
    // float flametails = sin3D(modelposition3, freq_1, 1.0) * disp;
    vec4 disp_4d = smootherstep(-1.0, 3.0, modelposition.x + modelposition.y) * vec4(u_Tail, u_Tail, 0.0, 0.0) +
                    vec4(modelposition3 * (2.0 + disp * 2.0), 0.0)
                    + vec4(0.0, 0.0, 0.0, 1.0);
    // vec4 disp_4d = vec4(0.0, 0.0, 0.0, 1.0);

    modelposition = modelposition + disp_4d;
    // modelposition = modelposition;

    gl_Position = u_ViewProj * modelposition; // used to render the final positions of the geometry's vertices
}