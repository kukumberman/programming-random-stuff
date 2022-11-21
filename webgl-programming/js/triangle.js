import { createShader, createProgram } from "./utils.js"

const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec3 a_color;

  varying vec3 v_color;

  void main() {
    gl_Position = vec4(a_position, 0, 1);
    v_color = a_color;
  }
`

const fragmentShaderSource = `
  precision mediump float;

  varying vec3 v_color;

  void main() {
    gl_FragColor = vec4(v_color, 1);
  }
`

const canvas = document.querySelector("canvas")
const gl = canvas.getContext("webgl")

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
const program = createProgram(gl, vertexShader, fragmentShader)

const positionAttribLocation = gl.getAttribLocation(program, "a_position")
const colorAttribLocation = gl.getAttribLocation(program, "a_color")

gl.useProgram(program)

gl.clearColor(0, 0, 1, 1)
gl.clear(gl.COLOR_BUFFER_BIT)

function drawPoints(coloredPoints) {
  const points = coloredPoints
    .map(p => p.position)
    .reduce((result, arr) => {
      result.push(...arr)
      return result
    }, [])
  
  const colors = coloredPoints
    .map(p => p.color)
    .reduce((result, arr) => {
      result.push(...arr)
      return result
    }, [])

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW)
  
  gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(positionAttribLocation)

  const colorBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)

  gl.vertexAttribPointer(colorAttribLocation, 3, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(colorAttribLocation)

  gl.drawArrays(gl.TRIANGLES, 0, coloredPoints.length)
}

drawPoints([
  { position: [0.5, 0.5], color: [1, 0, 0] },
  { position: [-0.5, 0.5], color: [1, 1, 0] },
  { position: [0, -0.5], color: [0, 1, 0] },
])
