import {vec3, vec4} from 'gl-matrix';
const Stats = require('stats-js');
import * as dat from 'dat.gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

const RESET = {
  tesselations: 5,
  shellHeight: 2.0,
  speed: 1.0,
  shellC0: '#FFEFC7',
  shellC1: '#825714',
  shellC2: '#88B83B',
  shellC3: '#2C7A0D',
  shellC4: '#85807A',
  shellC5: '#FFEFC7',
  shellC6: '#FFFFFF',
  skin:    '#1ab334',
};

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 5,

  // 0 to 10
  shellHeight: 2.0,
  // 0.0 to 5.0
  speed: 1.0,

  // 6 shell colors and1 skin color
  shellC0: '#FFEFC7',
  shellC1: '#825714',
  shellC2: '#88B83B',
  shellC3: '#2C7A0D',
  shellC4: '#85807A',
  shellC5: '#FFEFC7',
  shellC6: '#FFFFFF',
  skin:    '#1ab334',
  
  'Load Scene': loadScene,
};

let shell: Icosphere;
let head: Icosphere;
let lEye: Icosphere;
let rEye: Icosphere;
let lPupil: Icosphere;
let rPupil: Icosphere;
let frFoot: Icosphere;
let flFoot: Icosphere;
let brFoot: Icosphere;
let blFoot: Icosphere;
let tail: Icosphere;
let square: Square;
let prevTesselations: number = 5;
let time: number = 0.0;
let colorControllers: dat.GUIController[] = [];
let rootControllers: dat.GUIController[] = [];

function loadScene() {
  shell = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  shell.create();
  head = new Icosphere(vec3.fromValues(1, -0.2, 0), 0.3, controls.tesselations);
  head.create();
  lEye = new Icosphere(vec3.fromValues(1.1, -0.2, -.25), 0.1, controls.tesselations);
  lEye.create();
  rEye = new Icosphere(vec3.fromValues(1.1, -0.2, .25), 0.1, controls.tesselations);
  rEye.create();
  lPupil = new Icosphere(vec3.fromValues(1.12, -0.2, -.31), 0.07, controls.tesselations);
  lPupil.create();
  rPupil = new Icosphere(vec3.fromValues(1.12, -0.2, .31), 0.07, controls.tesselations);
  rPupil.create();
  frFoot = new Icosphere(vec3.fromValues(.5, -0.35, .6), 0.21, controls.tesselations);
  frFoot.create();
  flFoot = new Icosphere(vec3.fromValues(.5, -0.35, -.6), 0.21, controls.tesselations);
  flFoot.create();
  brFoot = new Icosphere(vec3.fromValues(-.5, -0.35, .6), 0.21, controls.tesselations);
  brFoot.create();
  blFoot = new Icosphere(vec3.fromValues(-.5, -0.35, -.6), 0.21, controls.tesselations);
  blFoot.create();
  tail = new Icosphere(vec3.fromValues(-.9, -0.25, 0), 0.11, controls.tesselations);
  tail.create();
  square = new Square(vec3.fromValues(0, 0, 10));
  square.create();
}

// get color from dat gui to shader color
function hexToVec4(hex: string, a = 1): vec4 {
  let h = hex as any;
  if (typeof h === 'number') {
    const r = ((h >> 16) & 0xFF) / 255;
    const g = ((h >> 8) & 0xFF) / 255;
    const b = (h & 0xFF) / 255;
    return vec4.fromValues(r, g, b, a);
  }
  const s = (hex as string).replace('#', '');
  const r = parseInt(s.substring(0, 2), 16) / 255;
  const g = parseInt(s.substring(2, 4), 16) / 255;
  const b = parseInt(s.substring(4, 6), 16) / 255;
  return vec4.fromValues(r, g, b, a);
}

function reset() {
  controls.tesselations = RESET.tesselations;
  controls.shellHeight  = RESET.shellHeight;
  controls.speed        = RESET.speed;
  controls.shellC0      = RESET.shellC0;
  controls.shellC1      = RESET.shellC1;
  controls.shellC2      = RESET.shellC2;
  controls.shellC3      = RESET.shellC3;
  controls.shellC4      = RESET.shellC4;
  controls.shellC5      = RESET.shellC5;
  controls.shellC6      = RESET.shellC6;
  controls.skin         = RESET.skin;

  rootControllers.forEach(c => c.updateDisplay());
  colorControllers.forEach(c => c.updateDisplay());
  time = 0;
  loadScene();
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
  const gui = new dat.GUI();
  gui.add(controls, 'Load Scene');

  gui.add(controls, 'shellHeight', 0, 5).step(0.01).name('Shell Height');
  gui.add(controls, 'speed', 0.0, 5.0).step(0.01).name('Speed');

  const colorsFolder = gui.addFolder('Colors');
  colorsFolder.addColor(controls, 'shellC0').name('Shell 0');
  colorsFolder.addColor(controls, 'shellC1').name('Shell 1');
  colorsFolder.addColor(controls, 'shellC2').name('Shell 2');
  colorsFolder.addColor(controls, 'shellC3').name('Shell 3');
  colorsFolder.addColor(controls, 'shellC4').name('Shell 4');
  colorsFolder.addColor(controls, 'shellC5').name('Shell 5');
  colorsFolder.addColor(controls, 'shellC6').name('Shell 6');
  colorsFolder.addColor(controls, 'skin').name('Skin');
  colorsFolder.close();

  (controls as any).Reset = reset;
  gui.add(controls as any, 'Reset').name('Restore to Defaults');

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

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  const stdlambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/std-lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/std-lambert-frag.glsl')),
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
    processKeyPresses();
    lambert.setTime(time);
    flat.setTime(time);

    const tScaled = time * controls.speed;
    // set dat gui controls
    lambert.setTime(tScaled);
    flat.setTime(tScaled);
    stdlambert.setTime(tScaled);

    // update shell uniforms
    lambert.setShellHeight(controls.shellHeight);

    const shellPalette = [
      hexToVec4(controls.shellC0),
      hexToVec4(controls.shellC1),
      hexToVec4(controls.shellC2),
      hexToVec4(controls.shellC3),
      hexToVec4(controls.shellC4),
      hexToVec4(controls.shellC5),
      hexToVec4(controls.shellC6),
    ];

    const skinColor = hexToVec4(controls.skin);

    lambert.setShellPalette(shellPalette);

    if(controls.tesselations != prevTesselations)
    {
      prevTesselations = controls.tesselations;
      shell = new Icosphere(vec3.fromValues(0, 0, 0), 1, prevTesselations);
      shell.create();
    }
    
    gl.depthMask(false);
    renderer.render(camera, flat, [
      square,
    ], tScaled);
    gl.depthMask(true);

    renderer.render(camera, lambert, [
      shell,
    ], tScaled);

    stdlambert.setGeometryColor(vec4.fromValues(0.0, 0.0, 0.0, 0.1));
    renderer.render(camera, stdlambert, [
      lEye,
      rEye
    ], tScaled);

    stdlambert.setGeometryColor(vec4.fromValues(1.0, 1.0, 1.0, 1.0));
    renderer.render(camera, stdlambert, [
      lPupil,
      rPupil
    ], tScaled);

    stdlambert.setGeometryColor(vec4.fromValues(skinColor[0], skinColor[1], skinColor[2], 0.7));
    renderer.render(camera, stdlambert, [
      head,
      frFoot,
      flFoot,
      brFoot,
      blFoot,
      lEye,
      rEye,
      tail
    ], tScaled);
    
    time++;
    time++;
    stats.end();
    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
    lambert.setDimensions(window.innerWidth, window.innerHeight);
    flat.setDimensions(window.innerWidth, window.innerHeight);
    stdlambert.setDimensions(window.innerWidth, window.innerHeight);
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  lambert.setDimensions(window.innerWidth, window.innerHeight);
  flat.setDimensions(window.innerWidth, window.innerHeight);
  stdlambert.setDimensions(window.innerWidth, window.innerHeight);

  // Start the render loop
  tick();
}

main();
