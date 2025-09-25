import { vec3, vec4 } from "gl-matrix";
const Stats = require("stats-js");
import * as DAT from "dat.gui";
import Icosphere from "./geometry/Icosphere";
import Square from "./geometry/Square";
import Cube from "./geometry/Cube";
import OpenGLRenderer from "./rendering/gl/OpenGLRenderer";
import Camera from "./Camera";
import { setGL } from "./globals";
import ShaderProgram, { Shader } from "./rendering/gl/ShaderProgram";

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 7,
  "Load Scene": loadScene, // A function pointer, essentially
  "Reload Scene": reloadScene,
  "Color Picker": [0, 0, 0],
  Frequency: 2,
  Amplitude: 0.4,
  "Enable Time": true,
  Background: true,
};

let icosphere: Icosphere;
let flameIcosphere: Icosphere;
let square: Square;
let cube: Cube;
let prevTesselations: number = 5;

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, 7.0);
  icosphere.create();

  flameIcosphere = new Icosphere(
    vec3.fromValues(0, 0, 0),
    0.5,
    controls.tesselations
  ); // radius 0.2, low tesselation for performance
  flameIcosphere.create();

  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
  // cube = new Cube(vec3.fromValues(0, 0, 0));
  // cube.create();
}

function reloadScene() {
  controls["Color Picker"] = [0, 0, 0];
  controls.Frequency = 2;
  controls.Amplitude = 0.4;
  controls["Enable Time"] = true;
  controls.Background = true;
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = "absolute";
  stats.domElement.style.left = "0px";
  stats.domElement.style.top = "0px";
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, "tesselations", 0, 8).step(1);
  gui.add(controls, "Load Scene");
  gui.add(controls, "Reload Scene");
  gui.addColor(controls, "Color Picker");
  gui.add(controls, "Frequency");
  gui.add(controls, "Amplitude");
  gui.add(controls, "Enable Time");
  gui.add(controls, "Background");

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement>document.getElementById("canvas");
  const gl = <WebGL2RenderingContext>canvas.getContext("webgl2");
  if (!gl) {
    alert("WebGL 2 not supported!");
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(
    vec3.fromValues(0, 3, -3),
    vec3.fromValues(0, 0, 0)
  );

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require("./shaders/flat-vert.glsl")),
    new Shader(gl.FRAGMENT_SHADER, require("./shaders/flat-frag.glsl")),
  ]);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require("./shaders/lambert-vert.glsl")),
    new Shader(gl.FRAGMENT_SHADER, require("./shaders/lambert-frag.glsl")),
  ]);

  // This function will be called every frame
  function tick() {
    const time = controls["Enable Time"] ? performance.now() / 1000 : 0;
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    if (controls.tesselations != prevTesselations) {
      prevTesselations = controls.tesselations;
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, prevTesselations);
      icosphere.create();
    }

    const color = vec4.create();
    vec3.divide(
      color,
      controls["Color Picker"],
      vec3.fromValues(255, 255, 255)
    );

    if (controls.Background) {
      gl.depthMask(false);
      renderer.render(
        camera,
        flat,
        [square],
        color,
        controls["Amplitude"],
        controls["Frequency"],
        time
      );
      gl.depthMask(true);
    }

    lambert.setObjectType(0);
    renderer.render(
      camera,
      lambert,
      [icosphere],
      color,
      controls["Frequency"],
      controls["Amplitude"],
      time
    );

    lambert.setObjectType(1);
    renderer.render(
      camera,
      lambert,
      [flameIcosphere],
      color,
      controls["Frequency"],
      controls["Amplitude"],
      time
    );
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener(
    "resize",
    function () {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.setAspectRatio(window.innerWidth / window.innerHeight);
      camera.updateProjectionMatrix();
      flat.setDimensions(window.innerWidth, window.innerHeight);
    },
    false
  );

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  flat.setDimensions(window.innerWidth, window.innerHeight);

  // Start the render loop
  tick();
}

main();
