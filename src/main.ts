import {vec3, vec4} from 'gl-matrix';
const Stats = require('stats-js');
import * as DAT from 'dat.gui';
import Icosphere from './geometry/Icosphere';
import Cube from './geometry/Cube';
import Square from './geometry/Square';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

const default_color1 = [255, 189, 19];
const default_color2 = [241, 37, 37];


// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 5,
  //'Cube Size': 1.0,
  color1: default_color1,
  color2: default_color2,
  'Layer 1 Amplitude': 5.0,
  'Layer 1 Frequency': 0.3,
  'Layer 2 Amplitude': 0.1,
  'Layer 2 Frequency': 5.0,
  'Reset': reset,
  'Load Scene': loadScene, // A function pointer, essentially
};

let icosphere: Icosphere;
let square: Square;
let prevTesselations: number = 5;


function reset() {
  controls.color1 = default_color1;
  controls.color2 = default_color2;
  controls['Layer 1 Amplitude'] = 5.0;
  controls['Layer 1 Frequency'] = 0.3;
  controls['Layer 2 Amplitude'] = 0.1;
  controls['Layer 2 Frequency'] = 5.0;
}

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
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
  //gui.add(controls, 'Cube Size', 0.5, 3.0).step(0.1);
  gui.addColor(controls, 'color1');
  gui.addColor(controls, 'color2');
  gui.add(controls, 'Layer 1 Amplitude', 0.0, 10.0);
  gui.add(controls, 'Layer 1 Frequency', 0.0, 10.0);
  gui.add(controls, 'Layer 2 Amplitude', 0.0, 10.0);
  gui.add(controls, 'Layer 2 Frequency', 0.0, 10.0);
  gui.add(controls, 'Reset');
  gui.add(controls, 'Load Scene');

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
    new Shader(gl.VERTEX_SHADER, require('./shaders/fireball-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/fireball-frag.glsl')),
  ]);

  // Uniforms
  const uTimeLoc = gl.getUniformLocation(lambert.prog, 'u_Time');
  const uColor1Loc = gl.getUniformLocation(lambert.prog, 'u_Color1');
  const uColor2Loc = gl.getUniformLocation(lambert.prog, 'u_Color2');
  const uLayer1AmpLoc = gl.getUniformLocation(lambert.prog, 'u_layer1_amp');
  const uLayer1FreqLoc = gl.getUniformLocation(lambert.prog, 'u_layer1_freq');
  const uLayer2AmpLoc = gl.getUniformLocation(lambert.prog, 'u_layer2_amp');
  const uLayer2FreqLoc = gl.getUniformLocation(lambert.prog, 'u_layer2_freq');

  let start = performance.now();

  // This function will be called every frame
  function tick() {

    const now = performance.now();
    const t = (now - start) * 0.001;
    gl.useProgram(lambert.prog);
    gl.uniform1f(uTimeLoc, t);
    gl.uniform3f(uColor1Loc, controls.color1[0] / 255.0, controls.color1[1] / 255.0, controls.color1[2] / 255.0);
    gl.uniform3f(uColor2Loc, controls.color2[0] / 255.0, controls.color2[1] / 255.0, controls.color2[2] / 255.0);
    gl.uniform1f(uLayer1AmpLoc, controls['Layer 1 Amplitude']);
    gl.uniform1f(uLayer1FreqLoc, controls['Layer 1 Frequency']);
    gl.uniform1f(uLayer2AmpLoc, controls['Layer 2 Amplitude']);
    gl.uniform1f(uLayer2FreqLoc, controls['Layer 2 Frequency']);

    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();

    if(controls.tesselations != prevTesselations)
    {
      prevTesselations = controls.tesselations;
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, prevTesselations);
      icosphere.create();
    }

    renderer.render(camera, lambert, [
      icosphere,
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
