# [Project 1: Noise](https://jyguan18.github.io/hw01-fireball/)

<div align="center">
    <img src="images/flower.png" alt="flower fire ball" width="500" />
</div>

## Introduction
For this project, I made a webGL procedural fireball and flower. I was inspired by the flower lab we did in class. I used WebFL and GLSL shaders to render the 3D surface and dat.GUI for the controls. I included multi-octave perlin noise and other procedural techniques to generate an animated, interactive "fireball" and a blooming flower from a base icosphere mesh.

Live Demo: [https://jyguan18.github.io/hw01-fireball/](https://jyguan18.github.io/hw01-fireball/)

## Fireball Shader
### Vertex Shader
* Geometry Base: Icosphere
* Displacement functions
   * Low-Frequency, high amplitude sine waves to make slow, large movement
   * High-frequency FBM (4 octaves) to make smaller turbulent bumps
   * Double-sampled FBM with an offset to prevent obvious repeating patterns
* Directional Masks
   * Radial + Vertical masks to reduce displacement along to base + edges to give a more rising, flame-like form
* Animation
   * u_Time is added as a parameter to the noise to make the boils 

### Fragment Shader
* Color Gradients
  * Mix between multiple colors based on vertex height + radial position
* To combat muted colors, I adjust saturation by mixing with a vibrant orange color
* I also wanted to give it more of a cooler or warmer tint, so I applied slight tinting to the dominant blue or red channel

## Flower Shader
### Vertex Shader
* Geometry Base: Icosphere, but squashed down on the y-axis
* Petal Formation:
   * Triangle wave function applied around the angle (polar coordinates) to create six evently spaced radial bumps, aka petals
   * Radial dip: Pulls down the center to form a flower core (and stem)
   * Tip lift: Each petal tip rises dynamically with u_Time
* Rotation: The whole flower is rotated along the y-axis

### Fragment Shader
* Color Gradient between pink at the base and magenta at the tips of the flower
* Petal Masking: I tried to use the triangle wave function to give the flower more visual depth
* Alpha < 1.0... I just liked how it looked at 0.9 HAHA
