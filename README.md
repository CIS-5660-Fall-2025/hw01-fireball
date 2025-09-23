# [Project 1: Noise - Turtle](https://github.com/CIS-566-Fall-2022/hw01-fireball-base)

![turtle picture](img/turtleImage.png)

Live Demo: [here](https://github.com/CIS-566-Fall-2022/hw01-fireball-base)

In this project I created a turtle by deforming an icosphere using layered noise with a Whorley-noise based water background. For the shell, I first distorted the icosphere with low frequency, high amplitude sin and cosin functions to get the rough shape, and then used high frequency, low amplitude FBM in order to finetune the distortion. Additionally I scaled the hight of the shell based on the radial distance from the center of the icosophere in the x,z plane. In my fragment shader I separated the colors into seven bands that scale in proportion to the total height of the shell, with the divisions between the colors also varying slightly with time. Then I used a gain function to smoothly blend between them. For the background I used whorley-noise to separate a square into cells that flowed and distorted with time, and then I used a gain function to change the color within the cell based on how closs it was to the edge. Finally through dat.GUI I added controls to adjust the speed of the simulation, the height of the turtles shell, and the various colors to blend between for the turtle.  
