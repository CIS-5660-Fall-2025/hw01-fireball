import {vec3, vec4} from 'gl-matrix';
const Stats = require('stats-js');
import * as DAT from 'dat.gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import Cube from './geometry/Cube';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 5,
  'Load Scene': loadScene, // A function pointer, essentially
  'Color' : 0xffffff,
  'Volatility' : 1,
  'Cartooniness' : 0.5,
  'Temperature' : 1.0,
  'Fireball Brightness' : 0.9,
  'Reset To Default': resetToDefault
};

let icosphere: Icosphere;
let square: Square;
let cube : Cube;

let prevColor : number;
let prevTesselations: number = 5;
let currColor : vec4;

let timeSinceStart = 0.;

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
  cube = new Cube(vec3.fromValues(0, 0, 0));
  cube.create();
}

function resetToDefault() {
  controls.tesselations = 5;
  controls.Color = 0xffffff;
  controls.Volatility = 1;
  controls.Cartooniness = 0.5;
  controls.Temperature = 1.0;
  controls['Fireball Brightness'] = 0.9;
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'tesselations', 0, 8).step(1);
  gui.add(controls, 'Load Scene');
  gui.addColor(controls, 'Color')
  gui.add(controls, 'Volatility', 0.6, 1.5);
  gui.add(controls, 'Cartooniness', 0, 1);
  gui.add(controls, 'Temperature', 0, 1);
  gui.add(controls, 'Fireball Brightness', 0, 1);
  gui.add(controls, 'Reset To Default');

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const width = canvas.width;
  const height = canvas.height;
  const aspect = (1.0*width)/(1.0*height);
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(6.55, .82, -4.46), vec3.fromValues(2.42, .59, 1.46));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  const passthroughShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/passthrough-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/raymarchBackground-frag.glsl')),
  ]);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  const customShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/custom-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/custom-frag.glsl')),
  ]);

  const fireBallShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/fireball-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/fireball-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    const deltaTime = 7.0/144.0; //7
    timeSinceStart += deltaTime;

    camera.update();
    // console.log(camera.controls.eye);
    // console.log(camera.controls.center);
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    if(controls.tesselations != prevTesselations)
    {
      prevTesselations = controls.tesselations;
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, prevTesselations);
      icosphere.create();
    }
    if(controls['Color'] != prevColor)
    {
      prevColor = controls['Color'];
      // Convert int color to vec4
      let col : vec4 = vec4.fromValues(((prevColor >> 16)*1.0)/255.0, (((prevColor >> 8) % 256)*1.0)/255.0, (((prevColor) % 256)*1.0)/255.0, 1);
      currColor = col;
    }
    renderer.render(camera, passthroughShader, [square], currColor, controls.Volatility, controls.Cartooniness, controls.Temperature, controls['Fireball Brightness'], timeSinceStart*0.5, aspect);
    renderer.render(camera, fireBallShader, [
      icosphere,
      //square,
      //cube,
    ], currColor, controls.Volatility, controls.Cartooniness, controls.Temperature, controls['Fireball Brightness'], timeSinceStart, aspect);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
