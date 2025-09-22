import ShaderProgram, {Shader} from './ShaderProgram';

// Function to create and load a texture from an image URL
export function loadTexture(gl: WebGL2RenderingContext, url: string, shader:ShaderProgram = null): WebGLTexture | null {
    const texture = gl.createTexture();
    if (!texture)
    {
        console.error('Error: unable to create texture');
        return null;
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);
  
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);

    const image = new Image();
    image.crossOrigin = 'anonymous';

    image.onload = () =>
    {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);
        
        // Add texture parameters for non-power-of-2 textures
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        if (shader)
        {
            console.log(`Image dimensions: ${image.width}x${image.height}`);
            shader.setDimensions(image.width, image.height);

            // hack just for background
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        }
    };

    image.onerror = () => 
    {
        console.error(`Failed to load texture from ${url}`);
    };

    image.src = url;
    return texture;
}