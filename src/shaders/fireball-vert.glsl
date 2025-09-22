#version 300 es

uniform mat4 u_Model;
uniform mat4 u_ModelInvTr;
uniform mat4 u_ViewProj;

uniform float u_Time;       // Time variable modified over time by TS

// Simulation Controls
uniform float u_NoiseFreq;
uniform float u_NoiseAmp;
uniform vec3 u_NoiseAnim;

uniform sampler2D u_NoiseTexture;

in vec4 vs_Pos;             // The array of vertex positions passed to the shader
in vec4 vs_Nor;             // The array of vertex normals passed to the shader
in vec4 vs_Col;             // The array of vertex colors passed to the shader.

out vec4 fs_Pos;
out vec4 fs_Nor;            // The array of normals that has been transformed by u_ModelInvTr. This is implicitly passed to the fragment shader.
out vec4 fs_Col;            // The color of each vertex. This is implicitly passed to the fragment shader.

// TODO: Convert to sliders
const float _NoiseFreq = 0.35;
const float _NoiseAmp = 0.6;
const vec3 _NoiseAnim = vec3(0.25, 1.25, 0.25);


/// NOTE: noise and fbm from: https://www.shadertoy.com/view/4ssGzn
float noise( in vec3 x )
{
    vec3 p = floor(x);
    vec3 f = fract(x);
	f = f*f*(3.0-2.0*f);
	
	vec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;
	vec2 rg = texture( u_NoiseTexture, (uv+0.5)/256.0 ).yx;
	return mix( rg.x, rg.y, f.z )*2.0-1.0;
}

float fbm( vec3 p )
{
    float f = 0.0;
    float amp = 0.5;
    for(int i=0; i<4; i++)
    {
        //f += abs(noise(p)) * amp;
        f += noise(p) * amp;
        p *= 2.03;
        amp *= 0.5;
	}
    return f;
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


    fs_Pos = vs_Pos;
    float displacement = fbm(fs_Pos.xyz*u_NoiseFreq + u_NoiseAnim*u_Time) * u_NoiseAmp;
    fs_Pos.xyz += fs_Nor.xyz * displacement;
    
    vec4 modelposition = u_Model * fs_Pos;   // Temporarily store the transformed vertex positions for use below
    gl_Position = u_ViewProj * modelposition;// gl_Position is a built-in variable of OpenGL which is
                                             // used to render the final positions of the geometry's vertices
}
