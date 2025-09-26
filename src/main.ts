import {vec2, vec3} from 'gl-matrix';
// import * as Stats from 'stats-js';
import * as DAT from 'dat.gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

import Cube from "./geometry/Cube";

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
let controls = {
  tesselations: 6,
  'Load Scene': loadScene, // A function pointer, essentially
  Color: [255,255,255],
  "Lambertian": false,
  Cube:true,
  Sphere:false,
  Square:false,
  "Main Time Scale": 0.7,
  "Color Gradient Time Scale": 0.7,
  "Worley Noise Scale": 1.0,
  "XZ Stretch Amplitude" : 1.0,
  "Outline Scale" : 10.0,
  "Outline Steps" : 15.0,
  "Smoke Step Size" : 0.4,
  "Smoke Max Steps" : 100,
  "Reset to Defaults" : function() {}, // Not sure best way to set this up, this feels awkward
  // Color: "#ff0000"
};

let icosphere: Icosphere;
let square: Square;
let prevTesselations: number = 6;

let cube: Cube;
let tallCube: Cube;

// let frameCount : number;
let time: number = 0;


function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();

  cube = new Cube(vec3.fromValues(0,0,0));
  cube.create();

  tallCube = new Cube(vec3.fromValues(0,40,0), vec3.fromValues(4,40,4));
  tallCube.create();
}


function main() {
  window.addEventListener('keypress', function (e) {
    // console.log(e.key);
    switch(e.key) {
      
      // Use this if you wish
    }
  }, false);

  window.addEventListener('keyup', function (e) {
    switch(e.key) {
      // Use this if you wish
    }
  }, false);
  // Initial display for framerate
  // const stats = Stats();
  // stats.setMode(0);
  // stats.domElement.style.position = 'absolute';
  // stats.domElement.style.left = '0px';
  // stats.domElement.style.top = '0px';
  // document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI({width:500});
  gui.add(controls, 'tesselations', 0, 8).step(1);
  // gui.add(controls, 'Time Scale', 0, 5.0);
  gui.add(controls, 'Main Time Scale', 0, 5.0).step(0.025);
  gui.add(controls, 'Color Gradient Time Scale', 0, 5.0).step(0.025);
  gui.add(controls, 'Worley Noise Scale', 0, 5.0).step(0.025);
  gui.add(controls, "XZ Stretch Amplitude", 0, 5.0).step(0.025);
  gui.add(controls, "Outline Scale", 0, 50.0).step(1);
  gui.add(controls, "Outline Steps", 0, 100.0).step(1);
  gui.add(controls, "Smoke Max Steps", 0, 1024.0).step(1);
  gui.add(controls, "Smoke Step Size", 0, 10.0).step(1/16);
  
  function resetToDefaults() {
    controls["tesselations"] = 6;
    controls["Main Time Scale"] = 0.7;
    controls["Color Gradient Time Scale"] = 0.7;
    controls["Worley Noise Scale"] = 1.0;
    controls["XZ Stretch Amplitude"] = 1.0;
    controls["Outline Scale"] = 10.0;
    controls["Outline Steps"] = 15.0; // ah dang forgot that
    controls["Smoke Step Size"]= 0.4;
    controls["Smoke Max Steps"] = 100;

    mouseX = 0;
    mouseY = 0;
    mouseZ = 0;
    
    fireballShader.setMouseCoords(mouseX, mouseY, mouseZ);


    gui.updateDisplay();
  }
  controls["Reset to Defaults"] = resetToDefaults;
  
  gui.add(controls, 'Reset to Defaults');
  // gui.updateDisplay();
  // gui.add(controls, 'Load Scene');
  
  // gui.addColor(controls, "Color");
  // gui.add(controls, 'Lambertian');
  // gui.add(controls, 'Sphere');
  // gui.add(controls, 'Square');
  // gui.add(controls, 'Cube');

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, -10), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  // renderer.setClearColor(0.2, 0.2, 0.2, 1);
  renderer.setClearColor(164.0 / 255.0, 233.0 / 255.0, 1.0, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  const noiseShaderProgram = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/custom-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/custom-frag.glsl')),
  ]);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);

  const fireballShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/fireball-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/fireball-frag.glsl')),
  ]);
  // const fireballShaderNoFrag = new ShaderProgram([
  //   new Shader(gl.VERTEX_SHADER, require('./shaders/fireball-vert.glsl')),
  //   new Shader(gl.FRAGMENT_SHADER, require('./shaders/fireball-noColor-frag.glsl')),
  // ]);
  // const fireballShader2 = new ShaderProgram([
  //   new Shader(gl.VERTEX_SHADER, require('./shaders/fireball-vert.glsl')),
  //   new Shader(gl.FRAGMENT_SHADER, require('./shaders/smoke-frag.glsl')),
  // ]);
  const fireroomShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/fireroom-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/fireroom-frag.glsl')),
  ]);
  // const smokeShader = new ShaderProgram([
  //   new Shader(gl.VERTEX_SHADER, require('./shaders/passthrough-vert.glsl')),
  //   new Shader(gl.FRAGMENT_SHADER, require('./shaders/smoke-post-frag.glsl')),
  // ]);
  const smokeShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/smoke-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/smoke-frag.glsl')),
  ]);
  const postShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/passthrough-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/postprocess-frag.glsl')),
  ]);

  function processKeyPresses() {
    // Use this if you wish
  }

  let mouseX = 0;
  let mouseY = 0;
  let mouseZ = 0;

  fireballShader.setMouseCoords(mouseX, mouseY, mouseZ);
  // fireballShaderNoFrag.setMouseCoords(mouseX, mouseY);
  // fireballShader2.setMouseCoords(mouseX, mouseY);

  let trailSpheres : Icosphere[] = [];

  function updateMousePos(event: MouseEvent) {
    // let newMouseX = event.pageX / window.innerWidth - 0.5;
    // let newMouseY = event.pageY / window.innerHeight - 0.5;
    let newMouseX = event.movementX;
    let newMouseY = event.movementY;
    // mouseX = newMouseX;
    // mouseY = newMouseY;
    if (event.altKey) {
    // if (event.altKey && (event.buttons & 1) === 1) {
      // let addedSphere = new Icosphere(vec3.fromValues(3 - newMouseX * 6, 3 - newMouseY * 6, 0), 0.5, 2);
      // addedSphere.create();
      // trailSpheres.push(addedSphere);
      
      // TODO I think I like the idea of moving around the fireball but having some sort of smoky particles trailing
      // so I think making separate spheres (or other shape) for 'clouds' coming out from it? 
      // mouseX += event.movementX;
      // mouseY += event.movementY;
      // console.log(mouseX, mouseY);
      // fireballShader.setMouseCoords(mouseX, mouseY);
      // fireballShaderNoFrag.setMouseCoords(mouseX, mouseY);
      // fireballShader2.setMouseCoords(mouseX, mouseY);

      // let right = vec3.fromValues(camera.viewMatrix[0], camera.viewMatrix[1], camera.viewMatrix[2]);
      // TODO figure out index
      // vec3.mul(right, right, newMouseX);

      let dx = camera.viewMatrix[0] * newMouseX - camera.viewMatrix[1] * newMouseY;
      let dy = camera.viewMatrix[4] * newMouseX - camera.viewMatrix[5] * newMouseY;
      let dz = camera.viewMatrix[8] * newMouseX - camera.viewMatrix[9] * newMouseY;

      mouseX += dx * 0.02;
      mouseY += dy * 0.02;
      mouseZ += dz * 0.02;

      fireballShader.setMouseCoords(mouseX, mouseY, mouseZ);

      // console.log(`${mouseX} ${mouseY} ${mouseZ}`)
      // console.log(`${dx} ${dy} ${dz}`);
      // console.log(`${camera} `);
      // for (let i = 0; i < 16; ++i) {
      //   console.log(camera.up[i]);
      // }

      // let forward = vec3.create();
      // vec3.sub(forward camera.target, camera.position);
      // camera.viewMatrix[]
      
    }
  }
  // let icosphere2 = new Icosphere(vec3.fromValues(0, 0, 0), 1.1, 5);
  // icosphere2.create();
  // function clickListener(event: MouseEvent) {
  //   let newMouseX = event.pageX / window.innerWidth;
  //   let newMouseY = event.pageY / window.innerHeight;
  //   mouseX = newMouseX;
  //   mouseY = newMouseY;
  //   if (event.altKey) {
  //   // if (event.altKey && (event.buttons & 1) === 1) {
  //     let addedSphere = new Icosphere(vec3.fromValues(3 - newMouseX * 6, 3 - newMouseY * 6, 0), 1, 2);
  //     addedSphere.create();
  //     trailSpheres.push(addedSphere);
  //   }
  // }
  // canvas.addEventListener("click", clickListener, false);
  canvas.addEventListener("mousemove", updateMousePos, false);

  // frameCount = 0;


  let buffer1 = gl.createFramebuffer();
  let texture1 = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture1);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, window.innerWidth, window.innerHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, buffer1);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture1, 0);
  
  let depthTexture = gl.createTexture();
  // let renderBuffer1 = gl.createRenderbuffer();
  // gl.bindRenderbuffer( gl.RENDERBUFFER)
  gl.bindTexture(gl.TEXTURE_2D, depthTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, window.innerWidth, window.innerHeight, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);


  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // This function will be called every frame
  function tick() {
    camera.update();
    // stats.begin();
    // gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, buffer1);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.setClearColor(0.0, 0.0, 0.0, 0.0);
    renderer.clear();
    processKeyPresses();

    // renderer.render(camera, fireroomShader, [
    //   cube,
    // ], time);
    // time++;
    if(controls.tesselations != prevTesselations)
    {
      prevTesselations = controls.tesselations;
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, prevTesselations);
      // icosphere2 = new Icosphere(vec3.fromValues(0, 0, 0), 1.1, prevTesselations);
      icosphere.create();
      // icosphere2.create();


      // for (let sphere of trailSpheres) {
        // sphere = new Icosphere()
        // TODO set tesselations
      // }
    }
    postShader.setOutlineScale(controls["Outline Scale"]);
    postShader.setOutlineSteps(controls["Outline Steps"]);
    

    let drawArr : any[] = [];
    // drawArr.push(icosphere);
    for (let sphere of trailSpheres) {
      drawArr.push(sphere);
    }

    gl.enable(gl.DEPTH_TEST);
    

    // renderer.render(camera, fireroomShader, [cube], ++time, 
    //   controls['Main Time Scale'], controls["Color Gradient Time Scale"], 
    //   controls["Worley Noise Scale"], controls["XZ Stretch Amplitude"]);
    
    // renderer.render(camera, fireballShader2, [icosphere2], ++time, 
    //   controls['Main Time Scale'], controls["Color Gradient Time Scale"], 
    //   controls["Worley Noise Scale"], controls["XZ Stretch Amplitude"]);
    renderer.render(camera, fireballShader, [icosphere], time, 
      controls['Main Time Scale'], controls["Color Gradient Time Scale"], 
      controls["Worley Noise Scale"], controls["XZ Stretch Amplitude"]);
    // renderer.render(camera, fireballShaderNoFrag, [icosphere], time, 
    //   controls['Main Time Scale'], controls["Color Gradient Time Scale"], 
    //   controls["Worley Noise Scale"], controls["XZ Stretch Amplitude"]);
    
    

    // if (!controls['Lambertian']) {
    //   noiseShaderProgram.setTime(++frameCount);
    // }

    
    // if (controls.Cube) {
    //   drawArr.push(cube);
    // }
    // if (controls.Square) {
    //   drawArr.push(square);
    // }
    // if (controls.Sphere) {
    //   drawArr.push(icosphere);
    // }

    // renderer.render(camera, controls["Lambertian"] ? lambert : noiseShaderProgram, drawArr,
    // controls.Color);
    // stats.end();

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    // renderer.clear();
    // renderer
    renderer.setClearColor(164.0 / 255.0, 233.0 / 255.0, 1.0, 1);
    renderer.clear();
    renderer.render(camera, fireroomShader, [cube], time, 
      controls['Main Time Scale'], controls["Color Gradient Time Scale"], 
      controls["Worley Noise Scale"], controls["XZ Stretch Amplitude"]);
    gl.disable(gl.DEPTH_TEST);


    smokeShader.setSmokeMaxSteps(controls["Smoke Max Steps"]);
    smokeShader.setSmokeStepSize(controls["Smoke Step Size"]);

    gl.enable(gl.DEPTH_TEST);

    renderer.render(camera, smokeShader, [tallCube], ++time, 
      controls['Main Time Scale'], controls["Color Gradient Time Scale"], 
      controls["Worley Noise Scale"], controls["XZ Stretch Amplitude"]);
    
    gl.disable(gl.DEPTH_TEST);

    // renderer.render(camera, smokeShader, [square], ++time, 
    //   controls['Main Time Scale'], controls["Color Gradient Time Scale"], 
    //   controls["Worley Noise Scale"], controls["XZ Stretch Amplitude"]);
    

    // renderer.render(camera, smokeShader, drawArr, ++time, 
    //   controls['Main Time Scale'], controls["Color Gradient Time Scale"], 
    //   controls["Worley Noise Scale"], controls["XZ Stretch Amplitude"]);
    
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    renderer.render(camera, postShader, [square], time, 
      controls['Main Time Scale'], controls["Color Gradient Time Scale"], 
      controls["Worley Noise Scale"], controls["XZ Stretch Amplitude"]);

    gl.enable(gl.DEPTH_TEST);
    // renderer.render(camera, fireballShader, [icosphere], time, 
    //   controls['Main Time Scale'], controls["Color Gradient Time Scale"], 
    //   controls["Worley Noise Scale"], controls["XZ Stretch Amplitude"]);
    

    ++time;
    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);

  }
  
  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
    flat.setDimensions(window.innerWidth, window.innerHeight);

    gl.bindTexture(gl.TEXTURE_2D, texture1);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, window.innerWidth, window.innerHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  
  gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, window.innerWidth, window.innerHeight, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  flat.setDimensions(window.innerWidth, window.innerHeight);

  // Start the render loop
  tick();
}

main();
