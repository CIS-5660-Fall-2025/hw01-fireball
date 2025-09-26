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
  octave:6,
  tint : [255, 230, 179],
  emissive: 1.5,
  color: [255, 0, 0],
  //'Load Scene': loadScene, // A function pointer, essentially
  'Restore': restore,
};

let icosphere: Icosphere;
let square: Square;
let cube: Cube;
let prevTesselations: number = 5;
let u_Time: number = 0.0;
let bgColor: vec4;

function restore() {
  controls.tesselations = 5;
  controls.octave = 6;
  controls.tint = [255, 230, 179];
  controls.emissive = 1.5;
  controls.color = [255, 0, 0];
}

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
  cube = new Cube(vec3.fromValues(0, 0, 0));
  cube.create();
}

function triangleWave(x: number, freq: number, amplitude: number): number {
  return Math.abs(((x * freq) % amplitude) - (0.5 * amplitude));
}

function background(t: number): vec4 {
  const tri = triangleWave(t, 0.2, 2.0); 
  const red  = [1.0, 0.0, 0.0];
  const blue = [0.0, 0.0, 1.0];
  const brightness = 0.4;

  const r = (red[0] * (1 - tri) + blue[0] * tri) * brightness;
  const g = (red[1] * (1 - tri) + blue[1] * tri) * brightness;
  const b = (red[2] * (1 - tri) + blue[2] * tri) * brightness;
  return vec4.fromValues(r, g, b, 1);
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
  //gui.add(controls, 'tesselations', 0, 8).step(1);
  gui.add(controls, 'octave', 3, 8).step(1);
  //gui.addColor(controls, 'color');
  gui.addColor(controls, 'tint');
  gui.add(controls, 'emissive', 0.3, 3.5).step(0.1);
  //gui.add(controls, 'Load Scene');
  gui.add(controls, 'Restore');

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
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    //new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    //new Shader(gl.VERTEX_SHADER, require('./shaders/trig-vert.glsl')),
    new Shader(gl.VERTEX_SHADER, require('./shaders/fireball-vert.glsl')),
    //new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
    //new Shader(gl.FRAGMENT_SHADER, require('./shaders/fbm-frag.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/fireball-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    u_Time += 1.0/60.0;
    bgColor = background(u_Time);
    gl.clearColor(bgColor[0], bgColor[1], bgColor[2], 1.0);
    if(controls.tesselations != prevTesselations)
    {
      prevTesselations = controls.tesselations;
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, prevTesselations);
      icosphere.create();
    }
    lambert.setOctave(controls.octave);
    lambert.setTint(vec4.fromValues(controls.tint[0]/255, controls.tint[1]/255, controls.tint[2]/255, 1));
    lambert.setEmissive(controls.emissive);
    lambert.setGeometryColor(vec4.fromValues(controls.color[0]/255, controls.color[1]/255, controls.color[2]/255, 1));
    lambert.setTime(u_Time);
    renderer.render(camera, lambert, [
      icosphere,
      // square,
      // cube,
    ]);
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
