#version 300 es
precision highp float;
precision highp int;

uniform vec4 u_Color;  
uniform float u_Time;

in vec4 fs_Pos;
in float vHeat;       
in vec3 vNormalW;  

out vec4 out_Col;

vec3 fireGradient(float t){
    vec3 c0 = vec3(0.05, 0.01, 0.00);
    vec3 c1 = vec3(0.80 * u_Color.x, 0.10 * u_Color.y, 0.00 * u_Color.z);
    vec3 c2 = vec3(1.00 * u_Color.x, 0.45 * u_Color.y, 0.00 * u_Color.z);
    vec3 c3 = vec3(1.00 * u_Color.x, 0.85 * u_Color.y, 0.20 * u_Color.z);
    vec3 c4 = vec3(1.00, 1.00, 1.00);

    if (t < 0.25)      return mix(c0, c1, t / 0.25);
    else if (t < 0.5)  return mix(c1, c2, (t - 0.25) / 0.25);
    else if (t < 0.75) return mix(c2, c3, (t - 0.5) / 0.25);
    else               return mix(c3, c4, (t - 0.75) / 0.25);
}

void main() {
    float t = vHeat;
    t += 0.06 * sin(u_Time * 2.2 + fs_Pos.y * 1.5);  
    t = clamp(t, 0.0, 1.0);

    vec3 base = u_Color.rgb;   
    vec3 col  = fireGradient(t);

    float fres = pow(1.0 - abs(dot(normalize(vNormalW), normalize(-fs_Pos.xyz))), 3.0);
    col = mix(col, vec3(1.0), fres * 0.25);

    float alpha = 0.3;       
    out_Col = vec4(col, alpha);
}
