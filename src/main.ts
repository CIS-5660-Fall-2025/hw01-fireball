import {vec2, vec3, vec4} from 'gl-matrix';
// import * as Stats from 'stats-js';
import * as DAT from 'dat.gui';
import Square from './geometry/Square';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import Icosphere from "./geometry/Icosphere";
import {GUIController} from "dat.gui";

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
    'Reset': reset, // A function pointer, essentially
    'OuterColor': '#ff0000',
    'InnerColor': '#0000ff',
    'Octaves': 3,
    'Initial Noise Scale': 2,
    'Lacunarity': 0.4,
    'Persistence': 0.3,
};

const gui = new DAT.GUI();
let outerColorControl : GUIController<object>;
let innerColorControl : GUIController<object>;
let octavesControl : GUIController<object>;
let initialNoiseScaleControl : GUIController<object>;
let lacunarityControl : GUIController<object>;
let persistenceControl : GUIController<object>;

let prevOctaves = 3;
let prevInitialNoiseScale = 2;
let prevLacunarity = 0.4;
let prevPersistence = 0.3;

let square: Square;
let sphere: Icosphere;
let sphereRadius: number = 3;
let innerSphere: Icosphere;
let innerSphereRadius: number = 2;
let eye1: Icosphere;
let eye2: Icosphere;
let time: number = 0;

function loadScene() {
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
  sphere = new Icosphere(vec3.fromValues(0, 0, 0), sphereRadius, 5);
  sphere.create();
  innerSphere = new Icosphere(vec3.fromValues(-0.4, -0.4, 0), innerSphereRadius, 5);
  innerSphere.create();
  eye1 = new Icosphere(vec3.fromValues(0.5, 1, 1), 0.25, 2);
  eye1.create();
  eye2 = new Icosphere(vec3.fromValues(0.5, 1, -1), 0.25, 2);
  eye2.create();
}

function reset() {
    outerColorControl.setValue('#ff0000');
    innerColorControl.setValue('#0000ff');
    octavesControl.setValue(3);
    initialNoiseScaleControl.setValue(2);
    lacunarityControl.setValue(0.4);
    persistenceControl.setValue(0.3);
}

function parseHexadecimalColor(color: string) : vec3 {
    let outColor : vec3 = [0, 0, 0];
    outColor[0] = parseInt(color.slice(1, 3), 16) / 255;
    outColor[1] = parseInt(color.slice(3, 5), 16) / 255;
    outColor[2] = parseInt(color.slice(5, 7), 16) / 255;

    return outColor;
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
  // const stats = Stats();
  // stats.setMode(0);
  // stats.domElement.style.position = 'absolute';
  // stats.domElement.style.left = '0px';
  // stats.domElement.style.top = '0px';
  // document.body.appendChild(stats.domElement);

  // Add controls to the gui
  //const gui = new DAT.GUI();
  outerColorControl = gui.addColor(controls, 'OuterColor');
  innerColorControl = gui.addColor(controls, 'InnerColor');
  octavesControl = gui.add(controls, 'Octaves', 1, 5).step(1);
  initialNoiseScaleControl = gui.add(controls, 'Initial Noise Scale', 0.1, 5).step(0.1);
  lacunarityControl = gui.add(controls, 'Lacunarity', 0.1, 1).step(0.1);
  persistenceControl = gui.add(controls, 'Persistence', 0.1, 1).step(0.1);
  let resetControl = gui.add(controls, 'Reset');

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
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);

  const fireball = new ShaderProgram([
      new Shader(gl.VERTEX_SHADER, require('./shaders/fireball-vert.glsl')),
      new Shader(gl.FRAGMENT_SHADER, require('./shaders/fireball-frag.glsl')),
  ])

    fireball.setOctaves(controls.Octaves);
  fireball.setInitialNoiseScale(controls["Initial Noise Scale"]);
  fireball.setLacunarity(controls["Lacunarity"]);
  fireball.setPersistence(controls["Persistence"]);

    const eye = new ShaderProgram([
        new Shader(gl.VERTEX_SHADER, require('./shaders/eye-vert.glsl')),
        new Shader(gl.FRAGMENT_SHADER, require('./shaders/eye-frag.glsl')),
    ])

  function processKeyPresses() {
    // Use this if you wish
  }

  // This function will be called every frame
  function tick() {
    camera.update();
    // stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    processKeyPresses();


    renderer.render(camera, flat, [
      square,
    ], time);

    if(controls.Octaves != prevOctaves) {
        prevOctaves = controls.Octaves;
        fireball.setOctaves(prevOctaves);
    }

    if(controls["Initial Noise Scale"] != prevInitialNoiseScale) {
        prevInitialNoiseScale = controls["Initial Noise Scale"];
        fireball.setInitialNoiseScale(prevInitialNoiseScale);
    }

    if(controls["Lacunarity"] != prevLacunarity){
        prevLacunarity = controls["Lacunarity"];
        fireball.setLacunarity(prevLacunarity);
    }

    if(controls["Persistence"] != prevPersistence) {
        prevPersistence = controls["Persistence"];
        fireball.setPersistence(prevPersistence);
    }

    let innerColor = parseHexadecimalColor(controls.InnerColor);
    fireball.setColor(vec4.fromValues(innerColor[0], innerColor[1], innerColor[2], 1));
    fireball.setRadius(innerSphereRadius);

    renderer.render(camera, fireball, [
        innerSphere
    ], time);

    let outerColor = parseHexadecimalColor(controls.OuterColor);
    fireball.setColor(vec4.fromValues(outerColor[0], outerColor[1], outerColor[2], 0.5));
    fireball.setRadius(sphereRadius);

    renderer.render(camera, fireball, [
        sphere,
    ], time);

    renderer.render(camera, eye, [
        eye1,
        eye2
    ], time);

    time++;
    // stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
    flat.setResolution(window.innerWidth, window.innerHeight);
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  flat.setResolution(window.innerWidth, window.innerHeight);

  // Start the render loop
  tick();
}

main();
