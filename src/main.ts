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
  tesselations: 6,
  noiseScale: 0.5,
  amplitude: 0.35,
  speed: 0.1,
  octaves: 4,
  'Load Scene': loadScene, // A function pointer, essentially
  outlineColor: [255, 0, 0],
  bodyColor: [255, 100, 0],
};

let icosphere: Icosphere;
let square: Square;
let cube: Cube; 
let prevTesselations: number = 5;
let prevNoiseScale: number = 1.5;
let prevAmplitude: number = 0.2;
let prevSpeed: number = 0.5;
let prevOctaves: number = 5;
let prevCameraPos: vec3 = vec3.fromValues(0,0,5);

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
  cube = new Cube(vec3.fromValues(0, 0, 0));
  cube.create(); 
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
  gui.add(controls, 'noiseScale', 0.01, 2.0).step(0.01);
  gui.add(controls, 'amplitude', 0.0, 1.0).step(0.01);
  gui.add(controls, 'speed', 0.0, 1.0).step(0.01);
  gui.add(controls, 'octaves', 1, 10).step(1);
  gui.addColor(controls, "bodyColor");
  gui.addColor(controls, "outlineColor");

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); 

  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.9, 0.9, 0.9, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  const perlin = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/custom-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/perlin-frag.glsl')),
  ]);

  const fire = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/fire-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/fire-frag.glsl')),
  ]);
  fire.setTurbulence(controls.noiseScale, controls.amplitude, controls.speed, controls.octaves);
  fire.setCameraWorldPos(camera.position); 

  function turbulenceSettingChanged(): boolean {
    return (prevNoiseScale != controls.noiseScale) || 
      (prevAmplitude != controls.amplitude) || 
      (prevSpeed != controls.speed) || 
      (prevOctaves != controls.octaves);
  }

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.setClearColor(0.2, 0.2, 0.2, 0.0);
    renderer.clear();
    const time = performance.now();


    fire.setCameraWorldPos(camera.position);

    if(controls.tesselations != prevTesselations)
    {
      prevTesselations = controls.tesselations;
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, prevTesselations);
      icosphere.create();
    }

    if(turbulenceSettingChanged()) {
      console.log("turbulence changed");

      prevNoiseScale = controls.noiseScale;
      prevAmplitude = controls.amplitude;
      prevSpeed = controls.speed;
      prevOctaves = controls.octaves;

      fire.setTurbulence(prevNoiseScale, prevAmplitude, prevSpeed, prevOctaves);
    }


    gl.enable(gl.CULL_FACE);
    gl.depthMask(false);

    gl.frontFace(gl.CW);
    // gl.cullFace(gl.FRONT);              // draw BACK faces first
    // renderer.render(camera, fire, [icosphere], controls.color, time);

    gl.cullFace(gl.BACK);               // then FRONT faces / only draw front faces
    renderer.render(camera, fire, [icosphere], controls.outlineColor, controls.bodyColor, time);

    gl.depthMask(true);
    gl.disable(gl.CULL_FACE);
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
