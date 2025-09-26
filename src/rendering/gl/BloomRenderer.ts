import {gl} from '../../globals';
import FramebufferManager from './FramebufferManager';
import FullscreenQuad from '../../geometry/FullscreenQuad';
import ShaderProgram, {Shader} from './ShaderProgram';

export default class BloomRenderer {
  private sceneFramebuffer: FramebufferManager;
  private horizontalBlurFramebuffer: FramebufferManager;
  private verticalBlurFramebuffer: FramebufferManager;
  
  private fullscreenQuad: FullscreenQuad;
  private blurShader: ShaderProgram;
  private compositeShader: ShaderProgram;
  
  private width: number;
  private height: number;
  
  // Bloom parameters
  public bloomStrength: number = 0.8;
  public bloomThreshold: number = 1.0;
  public blurSize: number = 2.0;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    
    // Create framebuffers
    this.sceneFramebuffer = new FramebufferManager(width, height);
    this.horizontalBlurFramebuffer = new FramebufferManager(width / 2, height / 2); // Half resolution for performance
    this.verticalBlurFramebuffer = new FramebufferManager(width / 2, height / 2);
    
    // Create fullscreen quad
    this.fullscreenQuad = new FullscreenQuad();
    this.fullscreenQuad.create();
    
    this.initShaders();
  }

  private initShaders() {
    // Create blur shader
    this.blurShader = new ShaderProgram([
      new Shader(gl.VERTEX_SHADER, require('../../shaders/blur-vert.glsl')),
      new Shader(gl.FRAGMENT_SHADER, require('../../shaders/blur-frag.glsl')),
    ]);

    // Create composite shader
    this.compositeShader = new ShaderProgram([
      new Shader(gl.VERTEX_SHADER, require('../../shaders/blur-vert.glsl')), // Same vertex shader
      new Shader(gl.FRAGMENT_SHADER, require('../../shaders/composite-frag.glsl')),
    ]);
  }

  beginScenePass() {
    // Render scene to framebuffer
    this.sceneFramebuffer.bind();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  endScenePass() {
    this.sceneFramebuffer.unbind();
  }

  renderBloom() {
    // Disable depth testing for post-processing
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);

    // Horizontal blur pass
    this.horizontalBlurFramebuffer.bind();
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    this.blurShader.use();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sceneFramebuffer.getColorTexture());
    
    if (this.blurShader.uniforms.u_Texture) {
      gl.uniform1i(this.blurShader.uniforms.u_Texture, 0);
    }
    if (this.blurShader.uniforms.u_Resolution) {
      gl.uniform2f(this.blurShader.uniforms.u_Resolution, this.width / 2, this.height / 2);
    }
    if (this.blurShader.uniforms.u_Direction) {
      gl.uniform2f(this.blurShader.uniforms.u_Direction, 1.0, 0.0); // Horizontal
    }
    if (this.blurShader.uniforms.u_BlurSize) {
      gl.uniform1f(this.blurShader.uniforms.u_BlurSize, this.blurSize);
    }
    
    this.blurShader.draw(this.fullscreenQuad);

    // Vertical blur pass
    this.verticalBlurFramebuffer.bind();
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.bindTexture(gl.TEXTURE_2D, this.horizontalBlurFramebuffer.getColorTexture());
    
    if (this.blurShader.uniforms.u_Direction) {
      gl.uniform2f(this.blurShader.uniforms.u_Direction, 0.0, 1.0); // Vertical
    }
    
    this.blurShader.draw(this.fullscreenQuad);

    // Composite final result
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    this.compositeShader.use();
    
    // Bind original scene texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sceneFramebuffer.getColorTexture());
    if (this.compositeShader.uniforms.u_OriginalTexture) {
      gl.uniform1i(this.compositeShader.uniforms.u_OriginalTexture, 0);
    }
    
    // Bind bloom texture
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.verticalBlurFramebuffer.getColorTexture());
    if (this.compositeShader.uniforms.u_BloomTexture) {
      gl.uniform1i(this.compositeShader.uniforms.u_BloomTexture, 1);
    }
    
    // Set bloom parameters
    if (this.compositeShader.uniforms.u_BloomStrength) {
      gl.uniform1f(this.compositeShader.uniforms.u_BloomStrength, this.bloomStrength);
    }
    if (this.compositeShader.uniforms.u_BloomThreshold) {
      gl.uniform1f(this.compositeShader.uniforms.u_BloomThreshold, this.bloomThreshold);
    }
    
    this.compositeShader.draw(this.fullscreenQuad);

    // Re-enable depth testing
    gl.enable(gl.DEPTH_TEST);
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    
    this.sceneFramebuffer.resize(width, height);
    this.horizontalBlurFramebuffer.resize(width / 2, height / 2);
    this.verticalBlurFramebuffer.resize(width / 2, height / 2);
  }

  cleanup() {
    this.sceneFramebuffer.cleanup();
    this.horizontalBlurFramebuffer.cleanup();
    this.verticalBlurFramebuffer.cleanup();
  }
}