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
out float fs_Displacement;

const vec4 lightPos = vec4(5, 5, 3, 1); //The position of our virtual light, which is used to compute the shading of
                                        //the geometry in the fragment shader.


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

float bias(float t, float power) {
    return pow(t, log(power) / log(0.5));
}

float gain(float t, float power) {
    return t < 0.5
        ? bias(2. * t, 1. - power) / 2.
        : 1. - bias(2. * (1. - t), 1. - power) / 2.;

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


    
    modelposition += fs_Displacement * vs_Nor;

    float noise1 = perlin(modelposition.xyz + vec3(sin(u_Time / 5000.), cos(u_Time / 5000.), 0.) * 3.); 
    float sine1 = sin(u_Time / ((cos(u_Time / 1234. + 10.) + 8.) * 300.));
    float disp1 = 0.25 * (gain(noise1 * sine1 * sine1, 0.8) * 2. - 1.);

    float noise2 = perlin((modelposition.xyz + vec3(0., cos(u_Time / 10000. + 1.), sin(u_Time / 10000.)) * 5.) * 2. + vec3(717., 913., 203.));
    float sine2 = sin(u_Time / ((cos(u_Time / 4321. + 4.) + 16.) * 200.) + 1.);
    float disp2 = 0.125 * (gain(noise2 * sine2 * sine2, 0.7) * 2. - 1.);

    float noise3 = perlin((modelposition.xyz + vec3(cos(u_Time / 22944. + 2.), 0., -sin(u_Time / 22944. + 3.)) * 2.) * 4. + vec3(-503., -213., 119.));
    float sine3 = sin(u_Time / ((cos(u_Time / 500. + 1.) + 24.) * 100.) + 2.);
    float disp3 = 0.0625 * (gain(noise3 * sine3 * sine3, 0.65) * 2. - 1.);

    float noise4 = perlin((modelposition.xyz + vec3(cos(u_Time / 14099.), sin(u_Time / 14099. + 1.), 0.) * 10.) * 8. + vec3(123., -243., 949.));
    float sine4 = sin(u_Time / ((cos(u_Time / 250. + 3.) + 32.) * 50.) + 3.);
    float disp4 = 0.03125 * (gain(noise4 * sine4 * sine4, 0.6) * 2. - 1.);

    float noise5 = perlin((modelposition.xyz + vec3(0., -sin(u_Time / 89294. + 12.421), cos(u_Time / 89294. - 12.4)) * 9.) * 16. + vec3(541., 921., -213.));
    float sine5 = sin(u_Time / ((cos(u_Time / 135. + 9.) + 40.) * 25.) + 4.);
    float disp5 = 0.015625 * (gain(noise5 * sine5 * sine5, 0.55) * 2. - 1.);
    
    modelposition += (disp1 + disp2 + disp3 + disp4 + disp5) * vs_Nor;
    fs_Displacement = (disp1 + disp2 + disp3 + disp4 + disp5 + 0.5) * 6.;


    fs_LightVec = lightPos - modelposition;  // Compute the direction in which the light source lies

    fs_Pos = modelposition;

    gl_Position = u_ViewProj * modelposition;// gl_Position is a built-in variable of OpenGL which is
                                             // used to render the final positions of the geometry's vertices
}
