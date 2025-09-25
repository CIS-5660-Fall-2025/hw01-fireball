import {vec3} from 'gl-matrix';
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
  baseColor : [155, 0, 0, 255],
  edgeColor : [230, 230, 0, 255],
  tailStart: -2.4,
  finStart: 0.75,
  speed: 1.,
};

let icosphere: Icosphere;
let bEye: Icosphere;    // back and front eyes of the fishy
let fEye: Icosphere;
let square: Square;
let cube: Cube;
let prevTesselations: number = 5;
let tickCount: number = 0;


const gui = new DAT.GUI();

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  bEye = new Icosphere(vec3.fromValues(0, 0, -4), 1, controls.tesselations);
  bEye.create();
  fEye = new Icosphere(vec3.fromValues(0, 0, 4), 1, controls.tesselations);
  fEye.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
  cube = new Cube(vec3.fromValues(1, 0, 0));
  cube.create();
  controls.tesselations = 5;
  controls.baseColor = [155, 0, 0, 255];
  controls.edgeColor = [230, 230, 0, 255];
  controls.tailStart = -2.4;
  controls.finStart = 0.75;
  controls.speed = 1.;
  gui.updateDisplay();
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
  gui.add(controls, 'tesselations', 0, 8).step(1);
  gui.add(controls, 'Load Scene');
  gui.add(controls, 'speed', 0., 8.).step(0.25);
  gui.add(controls, 'finStart', 0.6, 1.).step(0.05);
  gui.add(controls, 'tailStart', -2.5, .5).step(0.05);
  gui.addColor(controls, 'baseColor');
  gui.addColor(controls, 'edgeColor');

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
  renderer.setClearColor(0.4, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ])

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    if(controls.tesselations != prevTesselations)
    {
      prevTesselations = controls.tesselations;
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, prevTesselations);
      icosphere.create();
      bEye = new Icosphere(vec3.fromValues(0, 0, -4), 1, controls.tesselations);
      bEye.create();
      fEye = new Icosphere(vec3.fromValues(0, 0, 4), 1, controls.tesselations);
      fEye.create();
      //cube = new Cube(vec3.fromValues(1, 0, 0));
      //cube.create();
    }

    renderer.render(camera, lambert, [
      icosphere,
      // square,
      //cube,
    ], controls.baseColor.map(value => value / 255),
      controls.edgeColor.map(value => value / 255), tickCount,
      controls.finStart, controls.tailStart, controls.speed);
    renderer.render(camera, flat, [bEye,fEye,],
      controls.baseColor.map(value => value / 255),
      controls.edgeColor.map(value => value / 255), tickCount,
      controls.finStart, controls.tailStart, controls.speed);
    stats.end();

    ++tickCount;

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
