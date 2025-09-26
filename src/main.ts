import {vec3} from 'gl-matrix';
const Stats = require('stats-js');
import * as DAT from 'dat.gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 5,
  "hue offset": 0,
  "# octaves": 5,
  "fade rate": 0.05,
  reset: () => {
    gui.revert(gui);
  },
};

let icosphere: Icosphere;
let prevTesselations: number = 5;
const gui = new DAT.GUI();
let gl: WebGL2RenderingContext;

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations, gl);
  icosphere.create();
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
  gui.add(controls, "hue offset", 0, 1).step(Number.EPSILON);
  gui.add(controls, "# octaves", 0, 5).step(1);
  gui.add(controls, "fade rate", 0, 1).step(Number.EPSILON);
  gui.add(controls, "reset");

  // get canvas and webgl context
  const bg = <HTMLCanvasElement>document.getElementById("bg");
  const context = bg.getContext("2d");
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  gl = <WebGL2RenderingContext> canvas.getContext('webgl2', {preserveDrawingBuffer: true });
  if (!gl) {
    alert('WebGL 2 not supported!');
  }

  // Initial call to load scene
  loadScene();


  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas, gl);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl'), gl),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl'), gl),
  ], gl);

  // This function will be called every frame
  function tick(now: number) {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    if(controls.tesselations != prevTesselations)
    {
      prevTesselations = controls.tesselations;
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, prevTesselations, gl);
      icosphere.create();
    }

    renderer.render(camera, lambert, [
      icosphere,
    ], now, controls["hue offset"], controls["# octaves"]);
    stats.end();

    context.fillStyle = `#222232${Math.floor(controls["fade rate"] * 255).toString(16).slice(-2).padStart(2, "0")}`;
    context.fillRect(0, 0, innerWidth, innerHeight);
    context.drawImage(canvas, 0, 0);

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    bg.width = innerWidth;
    bg.height = innerHeight;
    context.fillStyle = "#223";
    context.fillRect(0, 0, innerWidth, innerHeight);

    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  bg.width = innerWidth;
  bg.height = innerHeight;
  context.fillStyle = "#223";
  context.fillRect(0, 0, innerWidth, innerHeight);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  requestAnimationFrame(tick);
}

main();
