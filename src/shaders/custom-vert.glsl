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

const vec4 lightPos = vec4(5, 5, 3, 1); //The position of our virtual light, which is used to compute the shading of
                                        //the geometry in the fragment shader.

mat3 rotZ(float o) {
    return mat3(
        cos(o), sin(o), 0., 
        -sin(o), cos(o), 0.,
        0., 0., 1.
        );
}

mat3 rotX(float o) {
    return mat3(
        1., 0., 0., 
        0., cos(o), sin(o),
        0., -sin(o), cos(o)
        );
}

vec3 sphericalToCartesian(vec3 spherical) {
    return spherical.x * vec3(sin(spherical.z) * cos(spherical.y), cos(spherical.z), sin(spherical.z) * sin(spherical.y));
}

vec3 moveOnSphere(vec3 param, float t) {
    vec3 spd = vec3(0.7, 1., 1.1) + param*vec3(.4, .3, .2);
    vec3 off = param*vec3(453.32,62.21,15.59);
    return sphericalToCartesian(vec3(sin(spd.x*t+off.x), spd.y*t+off.y, spd.z*t+off.z));
}

vec3 hash33(vec3 p3) // From https://www.shadertoy.com/view/4djSRW
{
	p3 = fract(p3 * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yxz+33.33);
    return fract((p3.xxy + p3.yxx)*p3.zyx);
}

vec3 modify(vec3 p) {
    float t = 0.1*u_Time;

    vec3 param = hash33(p);
    vec3 sphereMove = moveOnSphere(param, t);
    p += sphereMove*0.5;

    p = rotZ(t*0.5) * rotX(t*0.7) * p;
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


    vec4 modifiedPos = vec4(modify(vs_Pos.xyz), vs_Pos.w);
    vec4 modelposition = u_Model * modifiedPos;   // Temporarily store the transformed vertex positions for use below

    //modelposition.xyz += sin(0.1*u_Time*vec3(0.8,1.4,2.));

    fs_LightVec = lightPos - modelposition;  // Compute the direction in which the light source lies
    fs_Pos = modelposition;

    gl_Position = u_ViewProj * modelposition;// gl_Position is a built-in variable of OpenGL which is
                                             // used to render the final positions of the geometry's vertices
}
