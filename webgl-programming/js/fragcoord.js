import { createShader, createProgram } from "./utils.js"

const vertexShaderSource = `
  attribute vec2 a_position;

  void main() {
    gl_Position = vec4(a_position, 0, 1);
  }
`

const fragmentShaderSource = `
  precision mediump float;

  uniform vec2 u_resolution;
  uniform float u_time;

  void main() {
    vec2 uv01 = gl_FragCoord.xy / u_resolution;
    vec4 a = vec4(uv01, 0, 1);
    vec4 b = vec4(uv01, 1, 1);
    float t = (sin(u_time) + 1.) * 0.5; // convert from [-1..1] to [0..1] range, same as: sin(u_time) * 0.5 + 0.5;
    vec4 color = mix(a, b, t);
    gl_FragColor = color;
  }
`

const canvas = document.querySelector("canvas")
const gl = canvas.getContext("webgl")

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
const program = createProgram(gl, vertexShader, fragmentShader)

const positionAttribLocation = gl.getAttribLocation(program, "a_position")
const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution")
const timeUniformLocation = gl.getUniformLocation(program, "u_time")

gl.useProgram(program)

gl.clearColor(0, 0, 1, 1)
gl.clear(gl.COLOR_BUFFER_BIT)

const implOne = {
  data: {
    points: [
      -1, -1, // bottom left
      -1, +1, // top left
      +1, +1, // top right
      -1, -1, // bottom left
      +1, +1, // top right
      +1, -1, // bottom right
    ]
  },
  init() {
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.data.points), gl.STATIC_DRAW)

    gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(positionAttribLocation)

  },
  draw() {
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }
}

const implTwo = {
  data: {
    vertices: [
      -1, +1, // top left
      +1, +1, // top right
      +1, -1, // bottom right
      -1, -1, // bottom left
    ],
    indices: [
      0, 1, 2,
      0, 2, 3,
    ]
  },
  init() {
    const vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.data.vertices), gl.STATIC_DRAW)

    const indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(this.data.indices), gl.STATIC_DRAW)

    gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(positionAttribLocation)
  },
  draw() {
    gl.drawElements(gl.TRIANGLES, this.data.indices.length, gl.UNSIGNED_BYTE, 0)
  }
}

const app = {
  currentImplementation: null
}

function animate() {
  window.requestAnimationFrame(render)
}

function render(time) {
  window.requestAnimationFrame(render)
  gl.uniform1f(timeUniformLocation, time / 100)
  gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height)
  app.currentImplementation.draw(time)
}

function main() {
  app.currentImplementation = implOne
  app.currentImplementation.init()
  animate()
}

main()
