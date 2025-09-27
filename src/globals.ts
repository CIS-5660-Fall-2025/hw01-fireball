
export var gl: WebGL2RenderingContext;
export function setGL(_gl: WebGL2RenderingContext) {
  gl = _gl;
}

// Add this function to your main.ts file

export function loadTexture(url: string): WebGLTexture {
  // 1. Create a WebGL texture object. This is just a handle.
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  // 2. Put a single pixel in the texture so we can use it immediately.
  // This makes sure your program doesn't crash while the image is downloading.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]); // Opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);

  // 3. Create a JavaScript Image object and start loading the image file.
  const image = new Image();
  image.onload = function() {
    // 4. THIS IS THE CALLBACK: It runs once the image has finished downloading.
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);

    // Set texture parameters for filtering and wrapping.
    // gl.REPEAT is essential for your scrolling background.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    // Create Mipmaps for better quality.
    gl.generateMipmap(gl.TEXTURE_2D);
  };
  
  // This line starts the download. The callback above will be executed when it's done.
  image.src = url;

  // 5. Return the texture handle immediately. It will contain the blue pixel
  //    at first, and will be automatically updated with the sky image later.
  return texture;
}