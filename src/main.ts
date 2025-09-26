import {vec3} from 'gl-matrix';
import { vec4 } from 'gl-matrix';
const Stats = require('stats-js');
import * as DAT from 'dat.gui';
import Cube from './geometry/Cube';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 5,
  'Load Scene': loadScene, // A function pointer, essentially
  fireballColor: [255, 80, 0],
  noiseScale: 3.0,
  noiseIntensity: 0.8,
  waveAmplitude: 0.5,
  waveFrequency: 2.0,
  animate: true,
  useFireballShader: true
  
};

let cube: Cube;
let icosphere: Icosphere;
let square: Square;
let prevTesselations: number = 5;
let startTime: number = Date.now();

function loadScene() {

  cube = new Cube(vec3.fromValues(0, 0, 0));
  cube.create();

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
  gui.addColor(controls, 'fireballColor').name('Fireball Color');
  gui.add(controls, 'useFireballShader').name('Use Fireball Shader');
  gui.add(controls, 'animate').name('Animate');
  const fireballFolder = gui.addFolder('Fireball Settings');
  fireballFolder.add(controls, 'noiseScale', 0.5, 10.0).name('Noise Scale');
  fireballFolder.add(controls, 'noiseIntensity', 0, 1).name('Noise Intensity');
  fireballFolder.add(controls, 'waveAmplitude', 0, 0.5).step(0.01).name('Wave Amplitude');
  fireballFolder.add(controls, 'waveFrequency', 0, 5).step(0.1).name('Wave Speed');
  fireballFolder.open();

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
  renderer.setClearColor(0.1, 0.1, 0.15, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  const customShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/new-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/new-frag.glsl')),
  ]);

  const fireballShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/fireball-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/fireball-frag.glsl')),
  ]);

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
    }


     const color = vec4.fromValues(
      controls.fireballColor[0] / 255.0,
      controls.fireballColor[1] / 255.0,
      controls.fireballColor[2] / 255.0,
      1.0
    );

    const activeShader = controls.useFireballShader ? fireballShader : lambert;

    if (controls.useFireballShader) {
      const currentTime = (Date.now() - startTime) * 0.0008; 
      const animTime = controls.animate ? currentTime : 0;
      
      fireballShader.setTime(animTime);
      fireballShader.setWaveAmplitude(controls.waveAmplitude);
      fireballShader.setWaveFrequency(controls.waveFrequency);
      fireballShader.setNoiseScale(controls.noiseScale);
      fireballShader.setNoiseIntensity(controls.noiseIntensity);
    }

    renderer.render(camera, activeShader, [
      icosphere
    ], color);

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
