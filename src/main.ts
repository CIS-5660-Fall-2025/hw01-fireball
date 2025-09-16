import {vec3, vec4, vec2} from 'gl-matrix';
const Stats = require('stats.js');
import * as DAT from 'dat.gui';
import Icosphere from './geometry/Icosphere';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 5,
  Restore: () => {},
  color: [255, 0, 0],
  crack: 4.0,
  heightScale: 1.0,
  speed: 1.0, 
};

const defaults = {
  tesselations: 5,
  color: [255, 0, 0],
  crack: 4.0,
  heightScale: 1.0,
  speed: 1.0, 
};

let icosphere: Icosphere;
let icosphere2: Icosphere;
let prevTesselations: number = 5;

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();

  icosphere2 = new Icosphere(vec3.fromValues(0, 0.5, 0), 2, controls.tesselations);
  icosphere2.create();
}

let mouseNDC = [0, 0];  
let mouseDown = 0; 
let aspect = window.innerWidth / window.innerHeight;

let mouseRadiusPx = 240;
function radiusPxToNDC(px: number) {
  return (px / window.innerHeight) * 2.0;
}
let mouseRadiusNDC = radiusPxToNDC(mouseRadiusPx);

window.addEventListener('resize', () => {
  aspect = window.innerWidth / window.innerHeight;
  mouseRadiusNDC = radiusPxToNDC(mouseRadiusPx);
});

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top)  / rect.height;
  mouseNDC[0] = x * 2 - 1;
  mouseNDC[1] = 1 - y * 2;
});
canvas.addEventListener('mousedown', () => { mouseDown = 1; });
canvas.addEventListener('mouseup',   () => { mouseDown = 0; });

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
  gui.add(controls, 'tesselations', 0, 8).step(1).listen();;
  gui.addColor(controls, 'color').name('Base Color').listen();;
  gui.add(controls, 'crack', 0.0, 10.0).step(0.1).name('Crack').listen();;
  gui.add(controls, 'heightScale', 0.0, 5.0).step(0.01).name('Height Scale').listen();;
  gui.add(controls, 'speed', 0.0, 5.0).step(0.01).name('Speed').listen();;

  controls.Restore = () => {
    controls.tesselations = defaults.tesselations;
    controls.color        = [...defaults.color] as [number, number, number];
    controls.crack        = defaults.crack;
    controls.heightScale  = defaults.heightScale;
    controls.speed        = defaults.speed;

    loadScene();
  };
  gui.add(controls, 'Restore').name('Restore Defaults');

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

  const flame = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flame-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flame-frag.glsl')),
  ]);

  let timeSec = 0;
  let last = performance.now();

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

      icosphere2 = new Icosphere(vec3.fromValues(0, 0.5, 0), 2, controls.tesselations);
      icosphere2.create();
    }

    const now = performance.now();
    const dt = (now - last) * 0.001;
    last = now;
    timeSec += dt * controls.speed;

    const col = controls.color;
    const s = 1 / 255;

    gl.disable(gl.BLEND);
    gl.depthMask(true);

    renderer.render(camera, lambert, [
      icosphere,
    ], vec4.fromValues(col[0] * s, col[1] * s, col[2] * s, 1), 
    timeSec, controls.crack, controls.heightScale, vec2.fromValues(mouseNDC[0], mouseNDC[1]), mouseDown, mouseRadiusNDC, aspect);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);

    renderer.render(camera, flame, [
      icosphere2,
    ], vec4.fromValues(col[0] * s, col[1] * s, col[2] * s, 1), 
    timeSec, controls.crack, controls.heightScale, vec2.fromValues(mouseNDC[0], mouseNDC[1]), mouseDown, mouseRadiusNDC, aspect);

    gl.depthMask(true);
    
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
