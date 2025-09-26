#version 300 es

precision highp float;

in vec4 fs_Pos;
in vec4 fs_Nor;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.

void main()
{
    out_Col = vec4(0.f, 0.f, 0.f, 1.f);
}