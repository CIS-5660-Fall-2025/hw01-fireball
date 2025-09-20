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

uniform int u_Tick;         // This was written by me to give me a number for frame count
uniform float u_Fin;
uniform float u_Tail;
uniform float u_Speed;

in vec4 vs_Pos;             // The array of vertex positions passed to the shader

in vec4 vs_Nor;             // The array of vertex normals passed to the shader

in vec4 vs_Col;             // The array of vertex colors passed to the shader.

out vec4 fs_Pos;
out vec4 final_Pos;
out vec4 fs_Nor;            // The array of normals that has been transformed by u_ModelInvTr. This is implicitly passed to the fragment shader.
out vec4 fs_LightVec;       // The direction in which our virtual light lies, relative to each vertex. This is implicitly passed to the fragment shader.
out vec4 fs_Col;            // The color of each vertex. This is implicitly passed to the fragment shader.
out float fs_Time;
out float fs_Diff;

const vec4 lightPos = vec4(5, 5, 3, 1); //The position of our virtual light, which is used to compute the shading of
                                        //the geometry in the fragment shader.

void main()
{
    fs_Col = vs_Col;                         // Pass the vertex colors to the fragment shader for interpolation
    float tick = float(u_Tick);

    float timePulse = abs((tick * 0.001f)) * u_Speed;
    fs_Time = timePulse;
    vec3 funkyPos = vs_Pos.xyz;
    vec3 flame = funkyPos;

    // I got the base of this for loop from this Shadertoy:
    // https://www.shadertoy.com/view/3XXSWS
    // I experimented with different values, but the original had the best look
    // changing them more than +/- 20% glitches things out and can also crash your pc... :(
    float decay = 0.6;              // WARNING: do not increase this, it will crash your machine
    for (float d = 1.25; d < 15.; d /= decay ) {
            flame += cos((flame.yzx - vec3(d, timePulse/.1, timePulse) ) * d ) / d;
    }
    
    funkyPos.x -= .75f;
    fs_Pos = u_ViewProj * u_Model * vec4(funkyPos.xyz + vec3(1.25, 0, -5), vs_Pos.w);
    funkyPos.x *= 2.f;
    float tailStart = u_Tail;   //-0.5f;
    float finStart = u_Fin;     //0.85;
    if (funkyPos.x >= tailStart)
    {
        float normX = funkyPos.x - tailStart;
        normX *= min(normX, 1.0);
        funkyPos = mix(funkyPos, flame, normX);
    }
    else if (abs(funkyPos.z) >= finStart)
    {
        float normZ = abs(funkyPos.z) - finStart;
        normZ *= min(normZ, 1.0);
        funkyPos = mix(funkyPos, flame * 20., normZ);
    }

    fs_Diff = funkyPos.x - tailStart;

    // Reset it into the middle. This should be done before,
    // but it was a late change and I didn't want to recalculate the numbers...
    funkyPos.x += 2.;
    funkyPos.z -= 5.;   
    

    mat3 invTranspose = mat3(u_ModelInvTr);
    fs_Nor = vec4(invTranspose * vec3(vs_Nor), 0);          // Pass the vertex normals to the fragment shader for interpolation.
                                                            // Transform the geometry's normals by the inverse transpose of the
                                                            // model matrix. This is necessary to ensure the normals remain
                                                            // perpendicular to the surface after the surface is transformed by
                                                            // the model matrix.


    vec4 modelposition = u_Model * vec4(funkyPos, vs_Pos.w);   // Temporarily store the transformed vertex positions for use below


    fs_LightVec = lightPos - modelposition;  // Compute the direction in which the light source lies

    gl_Position = u_ViewProj * modelposition;// gl_Position is a built-in variable of OpenGL which is
                                             // used to render the final positions of the geometry's vertices
    final_Pos = gl_Position;
}
