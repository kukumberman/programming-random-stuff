import {
  createShader,
  createProgram,
  loadImageAsync
} from "./utils.js"

const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;

  uniform vec2 u_resolution;

  varying vec2 v_texCoord;

  void main() {
    v_texCoord = a_texCoord;
    
    vec2 normalizedPosition = a_position / u_resolution;
    vec2 position = normalizedPosition * 2. - 1.;
    position.y *= -1.;
    gl_Position = vec4(position, 0, 1);
  }
`

const fragmentShaderSource = `
  precision mediump float;
  
  uniform sampler2D u_image0;
  uniform sampler2D u_image1;
  uniform float u_t01;

  varying vec2 v_texCoord;

  void main() {
    vec4 texColor0 = texture2D(u_image0, v_texCoord);
    vec4 texColor1 = texture2D(u_image1, v_texCoord);
    vec4 color = mix(texColor0, texColor1, u_t01);
    gl_FragColor = color;
  }
`

const canvas = document.querySelector("canvas")
const gl = canvas.getContext("webgl")

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
const program = createProgram(gl, vertexShader, fragmentShader)

gl.useProgram(program)

const positionAttribLocation = gl.getAttribLocation(program, "a_position")
const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution")
const texCoordAttribLocation = gl.getAttribLocation(program, "a_texCoord")
const t01UniformLocation = gl.getUniformLocation(program, "u_t01")

function setRectangle(x, y, width, height) {
  const x1 = x
  const x2 = x + width
  const y1 = y
  const y2 = y + height

  const vertices = [
    x1, y1,
    x2, y1,
    x1, y2,
    x1, y2,
    x2, y1,
    x2, y2,
  ]

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
}

function createTexCoordBuffer() {
  const points = [
    0.0,  0.0,
    1.0,  0.0,
    0.0,  1.0,
    0.0,  1.0,
    1.0,  0.0,
    1.0,  1.0
  ]

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW)
}

function draw() {
  gl.clearColor(0, 0, 1, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)

  gl.drawArrays(gl.TRIANGLES, 0, 6)
}

async function main() {
  const rect = {
    x: 0,
    y: 0,
    width: gl.canvas.width,
    height: gl.canvas.height,
  }

  const images = await Promise.all([
    loadImageAsync("/resources/images/apple_red.png"),
    loadImageAsync("/resources/images/apple_green.png")
  ])

  gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height)

  const textures = images.map(image => {
    // create texture
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    const level = 0
    const internalFormat = gl.RGBA
    const srcFormat = gl.RGBA
    const srcType = gl.UNSIGNED_BYTE

    // upload image into texture
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image)

    return texture
  })
  
  const vertexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  setRectangle(rect.x, rect.y, rect.width, rect.height)
  
  const texCoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
  createTexCoordBuffer()

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(positionAttribLocation)

  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
  gl.vertexAttribPointer(texCoordAttribLocation, 2, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(texCoordAttribLocation)

  // assing both textures to shader
  const u_image0Location = gl.getUniformLocation(program, "u_image0")
  const u_image1Location = gl.getUniformLocation(program, "u_image1")
  gl.uniform1i(u_image0Location, 0)
  gl.uniform1i(u_image1Location, 1)

  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, textures[0])
  gl.activeTexture(gl.TEXTURE1)
  gl.bindTexture(gl.TEXTURE_2D, textures[1])

  // enable alpha blending
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  gl.enable(gl.BLEND)

  subscribeToMouseMove()
  
  draw()
}

function subscribeToMouseMove() {
  canvas.addEventListener("mousemove", (event) => {

    // const rect = canvas.getBoundingClientRect()
    // const mouseX = event.x - rect.left
    // const mouseY = event.y - rect.top
    // const t01 = mouseX / canvas.width

    const t01 = event.offsetX / canvas.width

    gl.uniform1f(t01UniformLocation, t01)
    draw()
  })
}

main()
