#version 300 es
precision highp float;

uniform vec4 u_BodyColor;
uniform vec4 u_OutlineColor;
uniform vec3 u_CameraWorldPos;
uniform float u_Time;

in vec4 fs_Col;
in vec3 fs_WorldPos;
in vec3 fs_WorldNor;

out vec4 out_Col;

float saturate(float x) { return clamp(x, 0.0, 1.0); }
float h3(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453123); }
float hash_FractSin(vec2 p)
{
	return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);   
}
void main()
{
    vec3 N = normalize(fs_WorldNor);
    vec3 V = normalize(u_CameraWorldPos - fs_WorldPos);
    float ndotv = saturate(dot(N, V));

    float nBody = h3(fs_WorldPos) * 2.0 - 1.0;
    float nEdge = h3(fs_WorldPos + vec3(19.19, 7.7, 3.3)) * 2.0 - 1.0;

    float powerBody = max(0.001, 2.0 + 1.0 * nBody);
    float powerOutline = max(0.001, 2.5 + 1.0 * nEdge);

    float tBody = pow(ndotv, powerBody);
    float alphaBody = mix(0.0, 0.7, tBody);

    float tOutline = pow(ndotv, powerOutline);
    float alphaOutline = mix(0.6, 0.0, tOutline);

    vec3 bodyCol = u_BodyColor.rgb * alphaBody;
    vec3 outlineCol = u_OutlineColor.rgb * alphaOutline;

    float alpha = max(alphaBody, alphaOutline);
    vec3 finalCol = bodyCol + outlineCol;

    float lum = dot(finalCol, vec3(0.2126, 0.7152, 0.0722));
    float keepProb = pow(1.0 - lum, 0.5);
    float timeFactor = sin(u_Time * 0.004);
    float rng = hash_FractSin(floor(gl_FragCoord.xy) * vec2(3.0, 3.0) + vec2(timeFactor * 59.0,timeFactor * 137.0));
    float keep = step(rng, keepProb);

    out_Col = vec4(finalCol * keep, alpha * keep);
}
