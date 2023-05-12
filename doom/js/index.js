const LUMP_INDICES = {
  THINGS: 1,
  LINEDEFS: 2,
  SIDEDEFS: 3,
  VERTEXES: 4,
  SEGS: 5,
  SSECTORS: 6,
  NODES: 7,
  SECTORS: 8,
  REJECT: 9,
  BLOCKMAP: 10,
}

const DOOM_WIDTH = 320
const DOOM_HEIGHT = 200

class Mathf {
  static remap(value, x1, y1, x2, y2) {
    return ((value - x1) * (y2 - x2)) / (y1 - x1) + x2
  }

  static clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
  }

  static lerp(a, b, t) {
    return a + (b - a) * t
  }

  static inverseLerp(a, b, value) {
    return (value - a) / (b - a)
  }
}

class WadReader {
  constructor(arrayBuffer) {
    this.textDecoder = new TextDecoder()
    this.dataView = new DataView(arrayBuffer)
    this.header = this.readHeader()
    this.directory = this.readDirectory()
  }

  readHeader() {
    return {
      identification: this.readString(0, 4),
      numlumps: this.readInt32(4),
      infotableofs: this.readInt32(8),
    }
  }

  readDirectory() {
    const directory = []

    for (let i = 0; i < this.header.numlumps; i++) {
      const offset = this.header.infotableofs + i * 16

      directory.push({
        filepos: this.readInt32(offset + 0),
        size: this.readInt32(offset + 4),
        name: this.readString(offset + 8, 8),
      })
    }

    return directory
  }

  readVertex(offset) {
    return {
      x: this.readInt16(offset + 0),
      y: this.readInt16(offset + 2),
    }
  }

  readLinedef(offset) {
    return {
      startVertex: this.readInt16(offset + 0),
      endVertex: this.readInt16(offset + 2),
      flags: this.readInt16(offset + 4),
      specialType: this.readInt16(offset + 6),
      sectorTag: this.readInt16(offset + 8),
      frontSidedef: this.readInt16(offset + 10),
      backSidedef: this.readInt16(offset + 12),
    }
  }

  readThing(offset) {
    return {
      x: this.readInt16(offset + 0),
      y: this.readInt16(offset + 2),
      angle: this.readInt16(offset + 4),
      type: this.readInt16(offset + 6),
      flags: this.readInt16(offset + 8),
    }
  }

  readInt32(offset) {
    return this.dataView.getInt32(offset, true)
  }

  readInt16(offset) {
    return this.dataView.getInt16(offset, true)
  }

  readString(offset, length) {
    const chunk = new Int8Array(this.dataView.buffer.slice(offset, offset + length))

    const indexOfZero = chunk.indexOf(0)
    if (indexOfZero === -1) {
      return this.textDecoder.decode(chunk)
    }

    const chunk2 = chunk.slice(0, indexOfZero)
    return this.textDecoder.decode(chunk2)
  }
}

class WadData {
  constructor(arrayBuffer) {
    this.reader = new WadReader(arrayBuffer)
  }

  getLumpIndex(name) {
    return this.reader.directory.findIndex((entry) => entry.name === name)
  }

  getLumpData(index, readFunc, numBytes) {
    const data = []
    const entry = this.reader.directory[index]
    const length = entry.size / numBytes
    for (let i = 0; i < length; i++) {
      const offset = entry.filepos + i * numBytes
      data.push(readFunc(offset))
    }
    return data
  }
}

class WadRuntime {
  constructor(name, wad) {
    this.name = name
    this.mapIndex = wad.getLumpIndex(name)
    if (this.mapIndex === -1) {
      throw new Error()
    }
    this.vertexes = wad.getLumpData(
      this.mapIndex + LUMP_INDICES.VERTEXES,
      (offset) => wad.reader.readVertex(offset),
      4
    )
    this.linedefs = wad.getLumpData(
      this.mapIndex + LUMP_INDICES.LINEDEFS,
      (offset) => wad.reader.readLinedef(offset),
      14
    )
    this.things = wad.getLumpData(
      this.mapIndex + LUMP_INDICES.THINGS,
      (offset) => wad.reader.readThing(offset),
      10
    )
  }
}

class MapData {
  constructor(wadRuntime) {
    this.vertexes = wadRuntime.vertexes
    this.bounds = this.getBounds()
    this.linedefs = wadRuntime.linedefs
    this.things = wadRuntime.things
  }

  getBounds() {
    const lastIndex = this.vertexes.length - 1
    const buffer = [...this.vertexes]

    buffer.sort((lhs, rhs) => lhs.x - rhs.x)
    const xMin = buffer[0].x
    const xMax = buffer[lastIndex].x

    buffer.sort((lhs, rhs) => lhs.y - rhs.y)
    const yMin = buffer[0].y
    const yMax = buffer[lastIndex].y

    return {
      xMin,
      xMax,
      yMin,
      yMax,
    }
  }
}

class Renderer {
  /**
   *
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext("2d")
  }

  circle(x, y, radius, color) {
    this.ctx.fillStyle = color
    const circle = new Path2D()
    circle.arc(x, y, radius, 0, 2 * Math.PI)
    this.ctx.fill(circle)
  }

  line(x1, y1, x2, y2, color) {
    this.ctx.strokeStyle = color
    this.ctx.beginPath()
    this.ctx.moveTo(x1, y1)
    this.ctx.lineTo(x2, y2)
    this.ctx.closePath()
    this.ctx.stroke()
  }

  clear(color) {
    this.ctx.fillStyle = color
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }
}

class MapTopDownRenderer {
  constructor(renderer, mapData, width, height) {
    this.renderer = renderer
    this.mapData = mapData
    this.width = width
    this.height = height
    this.padding = 25
    this.playerColors = ["red", "green", "blue", "yellow"]
  }

  drawLines() {
    for (let i = 0, length = this.mapData.linedefs.length; i < length; i++) {
      const line = this.mapData.linedefs[i]
      const p1 = this.remapVertex(this.mapData.vertexes[line.startVertex])
      const p2 = this.remapVertex(this.mapData.vertexes[line.endVertex])
      this.renderer.line(p1.x, p1.y, p2.x, p2.y, "orange")
    }
  }

  drawVertexes() {
    for (let i = 0, length = this.mapData.vertexes.length; i < length; i++) {
      const vertex = this.mapData.vertexes[i]
      const point = this.remapVertex(vertex)
      this.renderer.circle(point.x, point.y, 2, "white")
    }
  }

  drawPlayers() {
    for (let i = 0; i < 4; i++) {
      this.drawPlayer(i)
    }
  }

  drawDefaultPlayer() {
    return this.drawPlayer(0)
  }

  drawPlayer(index) {
    const color = this.playerColors[index]
    const thing = this.mapData.things[index]
    const point = this.remapVertex(thing)
    this.renderer.circle(point.x, point.y, 2, color)
  }

  remapVertex(vertex) {
    return {
      x: this.remapX(vertex.x),
      y: this.remapY(vertex.y),
    }
  }

  remapX(value) {
    const { xMin, xMax } = this.mapData.bounds
    const out_min = this.padding
    const out_max = this.width - this.padding
    return Mathf.remap(value, xMin, xMax, out_min, out_max)
  }

  remapY(value) {
    const { yMin, yMax } = this.mapData.bounds
    const out_min = this.padding
    const out_max = this.height - this.padding
    return Mathf.remap(value, yMin, yMax, out_max, out_min)
  }
}

async function main() {
  const response = await fetch("./wad/doom1.wad")
  const bytes = await response.arrayBuffer()

  const wad = new WadData(bytes)
  const wadRuntime = new WadRuntime("E1M1", wad)
  const mapData = new MapData(wadRuntime)

  const SCALE_FACTOR = 3
  const canvas = document.querySelector("canvas")
  canvas.width = DOOM_WIDTH * SCALE_FACTOR
  canvas.height = DOOM_HEIGHT * SCALE_FACTOR

  const renderer = new Renderer(canvas)
  const mapTopDownRenderer = new MapTopDownRenderer(renderer, mapData, canvas.width, canvas.height)

  renderer.clear("black")

  mapTopDownRenderer.drawLines()
  mapTopDownRenderer.drawVertexes()
  mapTopDownRenderer.drawDefaultPlayer()
}

main()
