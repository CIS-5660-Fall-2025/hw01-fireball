import {vec2, vec3} from 'gl-matrix';
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
  radius: 2,
  amp: 0.5,
  freq: 1.0,
  density: 80.0,
};

let square: Square;
let icosphere: Icosphere;
let cube: Cube; 
let time: number = 0;
let background: Icosphere;

function loadScene() {
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), controls.radius, controls.tesselations);
  icosphere.create();
  cube = new Cube(vec3.fromValues(0, 0, 0));
  cube.create();
  // time = 0;
  background = new Icosphere(vec3.fromValues(0, 0, 0), 30, 5);
  background.create();
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

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'tesselations', 0, 5).step(1);
  gui.add(controls, "radius", 1, 3).step(0.2);
  gui.add(controls, 'amp', 0.2, 0.8).step(0.01);
  gui.add(controls, 'freq', 0.0, 2.0).step(0.1);
  gui.add(controls, 'density', 30.0, 150.0).step(1.0).name('star density');

  gui.add({ reset: () => {
    // Reset all the parameters in controls
    controls.tesselations = 5;
    controls.radius = 2;
    controls.amp = 0.5;
    controls.freq = 1.0;
    controls.density = 80.0;
    // Update all controls in gui
    gui.__controllers.forEach(controller => controller.updateDisplay());
  }}, 'reset');

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
  renderer.setClearColor(164.0 / 255.0, 233.0 / 255.0, 1.0, 1);
  gl.enable(gl.DEPTH_TEST);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);

  //test lambert
  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  const test = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/fireball-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/fireball-frag.glsl')),
  ]);
  
  const bgShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/background-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/background-frag.glsl')),
  ]);
  

  function processKeyPresses() {
    // Use this if you wish
  }

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    icosphere = new Icosphere(vec3.fromValues(0, 0, 0), controls.radius, controls.tesselations);
    icosphere.create();

    processKeyPresses();
    renderer.render(camera, test, [
      icosphere,
    ], controls.amp, controls.freq);
    renderer.renderbg(camera, bgShader, [background], controls.density);
    time++;
    test.setTime(time * 0.01);
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
