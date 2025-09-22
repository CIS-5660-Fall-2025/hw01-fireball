#version 300 es

precision highp float;

uniform float u_Time;

in vec4 fs_Pos;
in vec4 fs_Nor;
in vec4 fs_Col;

out vec4 out_Col;

// shade a point based on distance
// Inspired by raymarch distance based shading in: https://www.shadertoy.com/view/4ssGzn
vec4 shadeByDistance(float d)
{
    float additional = sin(0.5 * u_Time) * 0.05;
    d += additional;

    vec4 yellow = (mix(vec4(3, 3, 3, 1), vec4(1, 1, 0, 1), d / 0.2));
    vec4 red = (mix(vec4(1, 1, 0, 1), vec4(1, 0, 0, 1), (d - 0.2) / 0.2));
    
    if (d >= 0.0 && d < 0.2) return yellow;
	if (d >= 0.2 && d < 0.5) return red;

    return mix(vec4(1, 1, 0, 1), vec4(1, 0, 0, 1), smoothstep(0.3, 0.6, d));
}

void main()
{
    // fs_Pos is already in local space to the sphere
    vec4 diffuseColor = shadeByDistance(0.25 * length(fs_Pos));  
    diffuseColor.a = 0.85;

    // Compute final shaded color
    out_Col = vec4(diffuseColor.rgb, diffuseColor.a);
}
