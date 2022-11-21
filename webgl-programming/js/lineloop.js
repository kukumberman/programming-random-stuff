import { createShader, createProgram } from "./utils.js"

const vertexShaderSource = `
  attribute vec2 a_position;

  void main() {
    gl_Position = vec4(a_position, 0, 1);
    gl_PointSize = 10.; // not used
  }
`

const fragmentShaderSource = `
  precision mediump float;

  void main() {
    gl_FragColor = vec4(1, 1, 1, 1);
  }
`

const canvas = document.querySelector("canvas")
const gl = canvas.getContext("webgl")

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
const program = createProgram(gl, vertexShader, fragmentShader)

const positionAttribLocation = gl.getAttribLocation(program, "a_position")

gl.useProgram(program)

gl.clearColor(0.5, 0.5, 0.5, 1)
gl.clear(gl.COLOR_BUFFER_BIT)

function drawClosedPath(points, count) {
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW)
  
  gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(positionAttribLocation)
  
  gl.drawArrays(gl.LINE_LOOP, 0, count)
}

drawClosedPath([
  0.5, 0.5,
  -0.5, 0.5,
  0, -0.5,
], 3)
