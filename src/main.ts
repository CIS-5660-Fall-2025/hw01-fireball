import {vec2, vec3, vec4} from 'gl-matrix';
import { GUI } from 'dat.gui';
import Icosphere from './geometry/Icosphere';
import MeteorBackground from './geometry/MeteorBackground';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import BloomRenderer from './rendering/gl/BloomRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

interface FireballLayer {
  icosphere: Icosphere;
  color: vec3;
  scale: number;
  name: string;
}

const controls = {
  subdivisions: 5,
  emissionStrength: 1.0,
  redLayer: {
    enabled: true,
    voronoiScale: 0.5,
    flameSize: 0.17,
    gradientStrength: 0.8
  },
  orangeLayer: {
    enabled: true,
    voronoiScale: 0.9,
    flameSize: 0.31,
    gradientStrength: 0.77
  },
  yellowLayer: {
    enabled: true,
    voronoiScale: 0.5,
    flameSize: 0.35,
    gradientStrength: 0.6
  },
  whiteLayer: {
    enabled: true,
    voronoiScale: 0.9,
    flameSize: 0.35,
    gradientStrength: 0.20
  },
  meteors: {
    enabled: true,
    count: 50,
    speed: 1.0,
    size: 0.15,
    brightness: 0.8,
    lifetime: 1.0
  },
  enableBloom: true,
  bloomStrength: 0.5,
  blurSize: 4.0,
  'Load Scene': loadScene,
  'Reset to Defaults': resetDefaults,
};

let fireballLayers: FireballLayer[] = [];
let meteorBackground: MeteorBackground;
let time: number = 0;
let lastTime: number = 0;
let bloomRenderer: BloomRenderer;

function resetDefaults() {
  controls.emissionStrength = 1.0;
  
  controls.redLayer.enabled = true;
  controls.redLayer.voronoiScale = 0.5;
  controls.redLayer.flameSize = 0.17;
  controls.redLayer.gradientStrength = 0.8;
  
  controls.orangeLayer.enabled = true;
  controls.orangeLayer.voronoiScale = 0.9;
  controls.orangeLayer.flameSize = 0.31;
  controls.orangeLayer.gradientStrength = 0.77;
  
  controls.yellowLayer.enabled = true;
  controls.yellowLayer.voronoiScale = 0.5;
  controls.yellowLayer.flameSize = 0.35;
  controls.yellowLayer.gradientStrength = 0.6;
  
  controls.whiteLayer.enabled = true;
  controls.whiteLayer.voronoiScale = 0.9;
  controls.whiteLayer.flameSize = 0.35;
  controls.whiteLayer.gradientStrength = 0.2;
  
  controls.meteors.enabled = true;
  controls.meteors.count = 50;
  controls.meteors.speed = 1.0;
  controls.meteors.size = 0.15;
  controls.meteors.brightness = 0.8;
  controls.meteors.lifetime = 1.0;
  
  controls.enableBloom = true;
  controls.bloomStrength = 0.5;
  controls.blurSize = 4.0;
}

function loadScene() {
  fireballLayers = [];
  
  const layerConfigs = [
    { name: 'Red (Inner)', color: vec3.fromValues(0.9, 0.1, 0.0), scale: 1.0 },
    { name: 'Orange', color: vec3.fromValues(1.0, 0.3, 0.0), scale: 1.1 },
    { name: 'Yellow', color: vec3.fromValues(1.0, 0.9, 0.1), scale: 1.2 },
    { name: 'White (Outer)', color: vec3.fromValues(1.0, 0.7, 0.6), scale: 1.3 }
  ];
  
  layerConfigs.forEach(config => {
    const icosphere = new Icosphere(vec3.fromValues(0, 0, 0), controls.subdivisions);
    icosphere.create();
    
    fireballLayers.push({
      icosphere: icosphere,
      color: config.color,
      scale: config.scale,
      name: config.name
    });
  });
  
  meteorBackground = new MeteorBackground();
  meteorBackground.create();
  
  console.log('Created layered fireball with meteor background');
}

function main() {
  window.addEventListener('keypress', function (e) {
    switch(e.key) {
      case 'r':
        resetDefaults();
        break;
      case 'b':
        controls.enableBloom = !controls.enableBloom;
        break;
      case 'm':
        controls.meteors.enabled = !controls.meteors.enabled;
        break;
    }
  }, false);

  const gui = new GUI();
  
  const fireballFolder = gui.addFolder('Global Fireball Controls');
  fireballFolder.add(controls, 'emissionStrength', 0.1, 1.0).name('Emission Strength');
  
  const redFolder = gui.addFolder('Red Layer (Inner)');
  redFolder.add(controls.redLayer, 'enabled').name('Enable');
  redFolder.add(controls.redLayer, 'voronoiScale', 0.5, 2.0).name('Voronoi Scale');
  redFolder.add(controls.redLayer, 'flameSize', 0.10, 0.90).name('Flame Size');
  redFolder.add(controls.redLayer, 'gradientStrength', 0.0, 1.0).name('Gradient Strength');
  
  const orangeFolder = gui.addFolder('Orange Layer');
  orangeFolder.add(controls.orangeLayer, 'enabled').name('Enable');
  orangeFolder.add(controls.orangeLayer, 'voronoiScale', 0.5, 2.0).name('Voronoi Scale');
  orangeFolder.add(controls.orangeLayer, 'flameSize', 0.10, 0.90).name('Flame Size');
  orangeFolder.add(controls.orangeLayer, 'gradientStrength', 0.0, 1.0).name('Gradient Strength');
  
  const yellowFolder = gui.addFolder('Yellow Layer');
  yellowFolder.add(controls.yellowLayer, 'enabled').name('Enable');
  yellowFolder.add(controls.yellowLayer, 'voronoiScale', 0.5, 2.0).name('Voronoi Scale');
  yellowFolder.add(controls.yellowLayer, 'flameSize', 0.10, 0.90).name('Flame Size');
  yellowFolder.add(controls.yellowLayer, 'gradientStrength', 0.0, 1.0).name('Gradient Strength');
  
  const whiteFolder = gui.addFolder('White Layer (Outer)');
  whiteFolder.add(controls.whiteLayer, 'enabled').name('Enable');
  whiteFolder.add(controls.whiteLayer, 'voronoiScale', 0.5, 2.0).name('Voronoi Scale');
  whiteFolder.add(controls.whiteLayer, 'flameSize', 0.10, 0.90).name('Flame Size');
  whiteFolder.add(controls.whiteLayer, 'gradientStrength', -1.0, 1.0).name('Gradient Strength');
  
  const meteorFolder = gui.addFolder('Meteor Background');
  meteorFolder.add(controls.meteors, 'enabled').name('Enable Meteors');
  meteorFolder.add(controls.meteors, 'count', 10, 100).step(5).name('Count').onChange(() => {
    if (meteorBackground) {
      meteorBackground.setParams({ count: controls.meteors.count });
    }
  });
  meteorFolder.add(controls.meteors, 'speed', 0.1, 3.0).name('Speed').onChange(() => {
    if (meteorBackground) {
      meteorBackground.setParams({ speed: controls.meteors.speed });
    }
  });
  meteorFolder.add(controls.meteors, 'size', 0.05, 0.5).name('Size').onChange(() => {
    if (meteorBackground) {
      meteorBackground.setParams({ size: controls.meteors.size });
    }
  });
  meteorFolder.add(controls.meteors, 'brightness', 0.1, 2.0).name('Brightness').onChange(() => {
    if (meteorBackground) {
      meteorBackground.setParams({ brightness: controls.meteors.brightness });
    }
  });
  meteorFolder.add(controls.meteors, 'lifetime', 0.5, 3.0).name('Lifetime').onChange(() => {
    if (meteorBackground) {
      meteorBackground.setParams({ lifetime: controls.meteors.lifetime });
    }
  });
  
  const bloomFolder = gui.addFolder('Bloom Effect');
  bloomFolder.add(controls, 'enableBloom').name('Enable Bloom');
  bloomFolder.add(controls, 'bloomStrength', 0.0, 2.0).name('Bloom Strength');
  bloomFolder.add(controls, 'blurSize', 0.5, 5.0).name('Blur Size');
  
  const sceneFolder = gui.addFolder('Scene');
  sceneFolder.add(controls, 'subdivisions', 3, 8).step(1).name('Subdivisions').onChange(loadScene);
  sceneFolder.add(controls, 'Load Scene');
  sceneFolder.add(controls, 'Reset to Defaults');
  
  fireballFolder.open();
  redFolder.open();
  meteorFolder.open();
  bloomFolder.open();

  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  setGL(gl);

  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 8), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.05, 0.05, 0.1, 1);
  
  bloomRenderer = new BloomRenderer(window.innerWidth, window.innerHeight);
  
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const fireball = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/fireball-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/fireball-frag.glsl')),
  ]);

  const meteor = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/meteor-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/meteor-frag.glsl')),
  ]);

  function processKeyPresses() {
    // Use this if you wish
  }

  function renderMeteorBackground(camera: Camera, shader: ShaderProgram, time: number) {
    if (!controls.meteors.enabled || !meteorBackground) return;
    
    shader.use();
    
    if (shader.uniforms.u_Time) {
      gl.uniform1f(shader.uniforms.u_Time, time * 0.01);
    }
    
    if (shader.uniforms.u_Resolution) {
      gl.uniform2f(shader.uniforms.u_Resolution, window.innerWidth, window.innerHeight);
    }
    
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    shader.drawInstanced(meteorBackground, meteorBackground.getInstanceCount());
    
    gl.enable(gl.DEPTH_TEST);
  }

  function renderFireballLayers(camera: Camera, shader: ShaderProgram, time: number) {
    const layerControls = [
      controls.redLayer,
      controls.orangeLayer,
      controls.yellowLayer,
      controls.whiteLayer
    ];
    
    gl.enable(gl.BLEND);
    gl.disable(gl.CULL_FACE);
    
    for (let i = fireballLayers.length - 1; i >= 0; i--) {
      const layer = fireballLayers[i];
      const layerControl = layerControls[i];
      
      if (!layerControl.enabled) continue;
      
      if (shader.uniforms.u_Time) {
        gl.uniform1f(shader.uniforms.u_Time, time * 0.01);
      }
      
      if (shader.uniforms.u_EmissionStrength) {
        gl.uniform1f(shader.uniforms.u_EmissionStrength, controls.emissionStrength);
      }
      
      if (shader.uniforms.u_FlameSize) {
        gl.uniform1f(shader.uniforms.u_FlameSize, layerControl.flameSize);
      }
      
      if (shader.uniforms.u_Scale) {
        gl.uniform1f(shader.uniforms.u_Scale, layer.scale);
      }
      
      if (shader.uniforms.u_VoronoiScale) {
        gl.uniform1f(shader.uniforms.u_VoronoiScale, layerControl.voronoiScale);
      }
      
      if (shader.uniforms.u_GradientStrength) {
        gl.uniform1f(shader.uniforms.u_GradientStrength, layerControl.gradientStrength);
      }
      
      if (shader.uniforms.u_Color) {
        gl.uniform4f(shader.uniforms.u_Color, 
          layer.color[0], 
          layer.color[1], 
          layer.color[2], 
          1.0);
      }
      
      renderer.render(camera, shader, [layer.icosphere], time);
    }
  }

  function tick() {
    const currentTime = performance.now();
    const deltaTime = lastTime === 0 ? 0 : (currentTime - lastTime) * 0.001;
    lastTime = currentTime;
    
    camera.update();
    processKeyPresses();
    
    if (meteorBackground && controls.meteors.enabled) {
      meteorBackground.updateTime(deltaTime);
    }
    
    bloomRenderer.bloomStrength = controls.bloomStrength;
    bloomRenderer.blurSize = controls.blurSize;
    
    if (controls.enableBloom) {
      bloomRenderer.beginScenePass();
      
      renderMeteorBackground(camera, meteor, time);
      
      fireball.use();
      
      renderFireballLayers(camera, fireball, time);
      
      bloomRenderer.endScenePass();
      
      bloomRenderer.renderBloom();
      
    } else {
      gl.viewport(0, 0, window.innerWidth, window.innerHeight);
      renderer.clear();
      
      renderMeteorBackground(camera, meteor, time);
      
      fireball.use();
      
      renderFireballLayers(camera, fireball, time);
    }
    
    time++;

    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    renderer.setSize(width, height);
    camera.setAspectRatio(width / height);
    camera.updateProjectionMatrix();
    fireball.setDimensions(width, height);
    meteor.setDimensions(width, height);
    
    bloomRenderer.resize(width, height);
  }, false);

  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.setAspectRatio(width / height);
  camera.updateProjectionMatrix();
  fireball.setDimensions(width, height);
  meteor.setDimensions(width, height);

  tick();
}

main();