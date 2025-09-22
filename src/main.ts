import {vec2, vec3, vec4} from 'gl-matrix';
const Stats = require('stats-js');
import * as DAT from 'dat.gui';
import Square from './geometry/Square';
import Cube from './geometry/Cube';
import Icosphere from './geometry/Icosphere';


import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {loadTexture, setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 5,
  'Load Scene': loadScene, // A function pointer, essentially
  u_ShellColor: [255.0, 120.0, 0.0, 1.0],
  u_FireballVelocity: {x: 1.0, y: -4.5, z: -0.6},
  u_TailLength: 1.1,
  u_FallSpeed: 2.0,

  'Reset Fireball': resetFireball
};

const fireballDefaults = {
  shellColor: [255, 120, 0, 1.0],
  fallSpeed: 2.0,
  tailLength: 1.1,
  velocity: {x: 1.0, y: -4.5, z: -0.6},
};

let gui: DAT.GUI; // Declare gui variable in global scope

function resetFireball() {
  // Copy default values into the live controls object
  controls.u_ShellColor = fireballDefaults.shellColor.slice();
  controls.u_FallSpeed = fireballDefaults.fallSpeed;
  controls.u_TailLength = fireballDefaults.tailLength;

  // For nested objects, copy property by property
  controls.u_FireballVelocity.x = fireballDefaults.velocity.x;
  controls.u_FireballVelocity.y = fireballDefaults.velocity.y;
  controls.u_FireballVelocity.z = fireballDefaults.velocity.z;

  // IMPORTANT: Refresh the GUI to show the new values
  if (gui) {
    for (let i in gui.__controllers) {
      gui.__controllers[i].updateDisplay();
    }
    for (let folderName in gui.__folders) {
      for (let i in gui.__folders[folderName].__controllers) {
        gui.__folders[folderName].__controllers[i].updateDisplay();
      }
    }
  }
}

let square: Square;
let innerFireball: Icosphere;
let outerFireball: Icosphere;

let time: number = 0;
let prevTesselations: number = 5;
let prevShellColor: Array<number> = controls.u_ShellColor.slice();
let prevFireballVel: Array<number> = [controls.u_FireballVelocity.x, controls.u_FireballVelocity.y, controls.u_FireballVelocity.z];
let prevTailLength: number = controls.u_TailLength;
let prevFallSpeed: number = controls.u_FallSpeed;
let skyTexture: WebGLTexture

function loadScene() {
  innerFireball = new Icosphere(vec3.fromValues(0, 0, 0), 0.85, 6);
  innerFireball.create();

  outerFireball = new Icosphere(vec3.fromValues(0.0, -0.15, 0), 1.1, 6);
  outerFireball.create();
  // square = new Square(vec3.fromValues(0, 0, 0));
  // square.create();
  //time = 0;
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
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // const gui = new DAT.GUI();
  gui = new DAT.GUI();
  gui.add(controls, 'tesselations', 0, 8).step(1);
  //gui.add(controls, 'Load Scene');
  gui.addColor(controls, 'u_ShellColor');
  gui.add(controls, 'u_FallSpeed');
  gui.add(controls, 'u_TailLength');
  const velocityFolder = gui.addFolder('Fireball Velocity');
  gui.add(controls, 'Reset Fireball');


  // resetFireball function now moved to global scope above

  // Add a slider for each component
  velocityFolder.add(controls.u_FireballVelocity, 'x', -10.0, 10.0).step(0.1);
  velocityFolder.add(controls.u_FireballVelocity, 'y', -10.0, 10.0).step(0.1);
  velocityFolder.add(controls.u_FireballVelocity, 'z', -10.0, 10.0).step(0.1);

  velocityFolder.open();

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

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.0 / 0.0, 0.0 / 255.0, 0.0, 1);

  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.DEPTH_TEST);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);
  
  const outter = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  const inner = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/inner-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/inner-frag.glsl')),
  ]);

  const sky = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/sky-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/sky-frag.glsl')),
  ]);

  
  skyTexture = loadTexture('asset/bg_sky.png');


  inner.setFireballVel(vec3.fromValues(
    controls.u_FireballVelocity.x,
    controls.u_FireballVelocity.y,
    controls.u_FireballVelocity.z,
  ));

  inner.setTailLength(controls.u_TailLength);

  sky.setFallSpeed(controls.u_FallSpeed);

  outter.setFireballVel(vec3.fromValues(
    controls.u_FireballVelocity.x,
    controls.u_FireballVelocity.y,
    controls.u_FireballVelocity.z,
  ));

  outter.setGeometryColor(vec4.fromValues(
    controls.u_ShellColor[0] / 255.0,
    controls.u_ShellColor[1] / 255.0,
    controls.u_ShellColor[2] / 255.0,
    controls.u_ShellColor[3]
  ));

  inner.setGeometryColor(vec4.fromValues(
    controls.u_ShellColor[0] / 255.0,
    controls.u_ShellColor[1] / 255.0,
    controls.u_ShellColor[2] / 255.0,
    controls.u_ShellColor[3]
  ));

  function processKeyPresses() {
    // Use this if you wish
  }

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    
    processKeyPresses();

    inner.setGeometryColor(vec4.fromValues(
      controls.u_ShellColor[0] / 255.0,
      controls.u_ShellColor[1] / 255.0,
      controls.u_ShellColor[2] / 255.0,
      controls.u_ShellColor[3]
    ));

    if(controls.u_ShellColor.some((v,i) => v != prevShellColor[i]))
    {
      prevShellColor = controls.u_ShellColor.slice();
      outter.setGeometryColor(vec4.fromValues(
        controls.u_ShellColor[0] / 255.0,
        controls.u_ShellColor[1] / 255.0,
        controls.u_ShellColor[2] / 255.0,
        controls.u_ShellColor[3]
      ));
    }

    if(controls.u_TailLength!= prevTailLength){
      inner.setTailLength(controls.u_TailLength);
    }

    if(controls.u_FallSpeed != prevFallSpeed){
      sky.setFallSpeed(controls.u_FallSpeed);
    }
    

    // Check if fireball velocity has changed
    let currentFireballVel = [controls.u_FireballVelocity.x, controls.u_FireballVelocity.y, controls.u_FireballVelocity.z];
    if(currentFireballVel.some((v,i) => v != prevFireballVel[i]))
    {
      prevFireballVel = currentFireballVel.slice();
      inner.setFireballVel(vec3.fromValues(
        controls.u_FireballVelocity.x,
        controls.u_FireballVelocity.y,
        controls.u_FireballVelocity.z,
      ));
      outter.setFireballVel(vec3.fromValues(
        controls.u_FireballVelocity.x,
        controls.u_FireballVelocity.y,
        controls.u_FireballVelocity.z,
      ));
    }
    // renderer.render(camera, flat, [
    //   square,
    // ], time);


    sky.use();
    sky.setTime(time);
    sky.setTextureSampler(skyTexture, 0);
    sky.setResolution(gl.canvas.width, gl.canvas.height);
    sky.setTexResolution(1024.0, 1024.0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    

    renderer.render(camera, inner, [
      innerFireball,
      //outerFireball
    ], time);

    renderer.render(camera, outter, [
      outerFireball,
      //outerFireball
    ], time);

    time++;
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
    flat.setDimensions(window.innerWidth, window.innerHeight);
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  flat.setDimensions(window.innerWidth, window.innerHeight);

  // Start the render loop
  tick();
}

main();
