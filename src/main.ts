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
  // color: 0xFFE317,
  color:  0x873826,
  currobject: "Icosphere",
  'Load Scene': loadScene, // A function pointer, essentially
  flametaillength: 1.0,
  framerate: 8.0
};

let icosphere: Icosphere;
let icosphere2: Icosphere;
let icosphere3: Icosphere;
let icosphere4: Icosphere;

let square: Square;
let cube: Cube;
let prevTesselations: number = 5;

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  icosphere2 = new Icosphere(vec3.fromValues(0.0, 0.3, 0), 0.7, controls.tesselations);
  icosphere2.create();
  icosphere3 = new Icosphere(vec3.fromValues(0.2, 0.4, 0.3), 0.5, controls.tesselations);
  icosphere3.create();
  icosphere4 = new Icosphere(vec3.fromValues(0.2, 0.4, 0.3), 500.0, controls.tesselations);
  icosphere4.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
  // cube = new Cube(vec3.fromValues(3.0, 0, 0));
  // cube.create();
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

  // gui.add(controls, 'Load Scene');
  gui.addColor(controls, 'color');
  gui.add(controls, 'flametaillength', 0, 8).step(0.1);
  gui.add(controls, "framerate", 1, 24).step(1);

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); 
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const texture = gl.createTexture();
  const image = new Image();
  image.src = './tex1.png'; // Replace with your image
  image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
          gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image
      );
      gl.generateMipmap(gl.TEXTURE_2D);

      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));
  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  const lambert2 = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/actualfire-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/actualfire-frag.glsl')),
  ]);

   const lambert3 = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/background-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/background-frag.glsl')),
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
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
      icosphere.create();
      icosphere2 = new Icosphere(vec3.fromValues(0.3, 0.4, 0), 0.7, controls.tesselations);
      icosphere2.create();
      icosphere3 = new Icosphere(vec3.fromValues(0.2, 0.4, 0.3), 0.5, controls.tesselations);
      icosphere3.create();
      icosphere4 = new Icosphere(vec3.fromValues(0.2, 0.4, 0.3),  500.0, controls.tesselations);
      icosphere4.create();
    }
   
    if (controls.currobject == "Icosphere"){
    renderer.render(camera, [lambert3,
      lambert, lambert2, lambert2, lambert2, ], [
              icosphere4,

      icosphere,
      icosphere,
      icosphere2,
      icosphere3,
    ], controls.color, controls.flametaillength, controls.framerate);

    
   }
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

// TODO: use four functions in toolbox functions slide and three dat.gui adjustables
