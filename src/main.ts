import {vec3, mat4} from 'gl-matrix';
import * as dat from 'dat.gui';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL, gl} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import Icosphere from './geometry/Icosphere';
import Quad from './geometry/Quad';

const controls = {
  displacement: 0.5,
  pulseSpeed: 0.03,
  colorIntensity: 1.2,
  'Reset': () => Object.assign(controls, {displacement: 0.5, pulseSpeed: 0.03, colorIntensity: 1.2})
};

let mesh: Icosphere;
let background: Quad;
let time = 0;
let startTime: number;

function loadScene() {
  background = new Quad();
  background.create();
  mesh = new Icosphere(vec3.fromValues(0, 0, 0), 1, 4);
  mesh.create();
  startTime = Date.now();
}

function main() {
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) alert('WebGL 2 not supported!');
  setGL(gl);

  loadScene();
  const camera = new Camera(vec3.fromValues(0, 1, -4), vec3.fromValues(0, 0, 0));
  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.0, 0.0, 0.0, 1);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const backgroundShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/background-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/background-frag.glsl')),
  ]);

  const fireballShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);

  const gui = new dat.GUI();
  gui.add(controls, 'displacement', 0, 1).step(0.01).name('Fire Size');
  gui.add(controls, 'pulseSpeed', 0.01, 0.1).step(0.01).name('Fire Speed');
  gui.add(controls, 'colorIntensity', 0.5, 2).step(0.1).name('Fire Intensity');
  gui.add(controls, 'Reset');

  function tick() {
    camera.update();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    mesh.update(Date.now() - startTime);

    gl.disable(gl.DEPTH_TEST);
    backgroundShader.use();
    backgroundShader.setTime(time);
    backgroundShader.draw(background);
    gl.enable(gl.DEPTH_TEST);

    fireballShader.use();
    const model = mat4.create();
    const viewProj = mat4.create();
    mat4.multiply(viewProj, camera.projectionMatrix, camera.viewMatrix);
    
    fireballShader.setModelMatrix(model);
    fireballShader.setViewProjMatrix(viewProj);
    fireballShader.setTime(time);
    
    gl.uniform1f(gl.getUniformLocation(fireballShader.prog, 'u_Displacement'), controls.displacement);
    gl.uniform1f(gl.getUniformLocation(fireballShader.prog, 'u_PulseSpeed'), controls.pulseSpeed);
    gl.uniform1f(gl.getUniformLocation(fireballShader.prog, 'u_ColorIntensity'), controls.colorIntensity);
    
    fireballShader.draw(mesh);
    time++;
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  tick();
}

main();