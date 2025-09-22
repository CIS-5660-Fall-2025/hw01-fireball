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
import {loadTexture} from './rendering/gl/Texture';
import noiseTex from './textures/noise_rgb_256_256.png';
import backgroundTex from './textures/bg_space_seamless.png';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 5,
  NoiseFrequency: 0.35,
  NoiseAmp: 0.6,
  NoiseAnimX: 0.25,
  NoiseAnimY: 1.25,
  NoiseAnimZ: 0.25
};

let NoiseFreqUnif: WebGLUniformLocation;
let NoiseAmpUnif: WebGLUniformLocation;
let NoiseAnimUnif: WebGLUniformLocation;

let NoiseTextureHandle: WebGLTexture|null;
let BackgroundTextureHandle: WebGLTexture|null;

function initSimParams(fireballShader:ShaderProgram, gl:WebGL2RenderingContext)
{
  NoiseFreqUnif = gl.getUniformLocation(fireballShader.prog, "u_NoiseFreq");
  NoiseAmpUnif = gl.getUniformLocation(fireballShader.prog, "u_NoiseAmp");
  NoiseAnimUnif = gl.getUniformLocation(fireballShader.prog, "u_NoiseAnim");
}

function updateSimParams(freq:number, amp:number, anim:vec3, fireballShader:ShaderProgram, gl:WebGL2RenderingContext)
{
  fireballShader.use();
  if (NoiseFreqUnif !== -1)
    gl.uniform1f(NoiseFreqUnif, freq);

  if (NoiseAmpUnif !== -1)
    gl.uniform1f(NoiseAmpUnif, amp);

  if (NoiseAnimUnif !== -1)
    gl.uniform3f(NoiseAnimUnif, anim[0], anim[1], anim[2]);
}

let icosphere: Icosphere;
let square: Square;
let cube: Cube;
let prevTesselations: number = 5;

const startTime: number = Date.now() / 1000.0;

const getElapsedTime = (): number => {
  return (Date.now()/1000.0) - startTime;
}

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
  cube = new Cube(vec3.fromValues(0,0,0), 1);
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
  const NOISE_ANIM_MAX = 2.0;
  gui.add(controls, 'tesselations', 0, 8).step(1);
  gui.add(controls, 'NoiseFrequency', 0, 2).step(0.01);
  gui.add(controls, 'NoiseAmp', 0, 2).step(0.01);
  gui.add(controls, 'NoiseAnimX', 0.0, NOISE_ANIM_MAX).step(0.01);
  gui.add(controls, 'NoiseAnimY', 0.0, NOISE_ANIM_MAX).step(0.01);
  gui.add(controls, 'NoiseAnimZ', 0.0, NOISE_ANIM_MAX).step(0.01);

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

  const fireballShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/fireball-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/fireball-frag.glsl')),
  ]);

  const bgShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/bg-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/bg-frag.glsl')),
  ]);

  // Bind noise and background textures
  NoiseTextureHandle = loadTexture(gl, noiseTex);
  BackgroundTextureHandle = loadTexture(gl, backgroundTex, bgShader);
  
  // Configure both global textures
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, NoiseTextureHandle);

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, BackgroundTextureHandle);

  function setupShaderTextures(shader:ShaderProgram, texture:WebGLTexture|null, name:string, slot:number)
  {
    shader.use();

    gl.activeTexture(gl.TEXTURE0 + slot);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const texLocation = gl.getUniformLocation(shader.prog, name);

    if (texLocation) gl.uniform1i(texLocation, slot);
  }

  initSimParams(fireballShader, gl);

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

    fireballShader.setTime(getElapsedTime());
    updateSimParams(
      controls.NoiseFrequency.valueOf(),
      controls.NoiseAmp.valueOf(),
      vec3.fromValues(controls.NoiseAnimX.valueOf(), controls.NoiseAnimY.valueOf(), controls.NoiseAnimZ.valueOf()),
      fireballShader,
      gl
    );
    
    gl.depthFunc(gl.ALWAYS); // for simplicity, just always draw the background and the fireball..
    
    // For simplicity, just use slot 0 for both textures.
    setupShaderTextures(bgShader, BackgroundTextureHandle, "u_BackgroundTexture", 0);
    renderer.render(camera, bgShader, [square]);
    
    setupShaderTextures(fireballShader, NoiseTextureHandle, "u_NoiseTexture", 0);
    renderer.render(camera, fireballShader, [icosphere]);
    
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
