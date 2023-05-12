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

const SUBSECTOR_IDENTIFIER = 0x8000 // 32768

const DOOM_WIDTH = 320
const DOOM_HEIGHT = 200

class Transform {
  constructor(ctx) {
    this.ctx = ctx
    this.s = 1
    this.dx = 0
    this.dy = 0
  }

  scale(s) {
    this.ctx.scale(s, s)
    this.s *= 1 / s
    this.dx *= 1 / s
    this.dy *= 1 / s
  }

  translate(dx, dy) {
    this.ctx.translate(dx, dy)
    this.dx -= dx
    this.dy -= dy
  }

  transform({ x, y }) {
    return {
      x: this.s * x + this.dx,
      y: this.s * y + this.dy,
    }
  }
}

class PanAndZoom {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = this.canvas.getContext("2d")
    this.transform = new Transform(this.ctx)

    this.listeners = {
      wheel: this.onWheel.bind(this),
      mousedown: this.onMouseDown.bind(this),
      mousemove: this.onMouseMove.bind(this),
      mouseup: this.onMouseUp.bind(this),
      contextmenu: (event) => event.preventDefault(),
    }

    this.config = {
      incrementalScale: 0.2,
    }

    this.dirty = false
  }

  addEventListeners() {
    this.canvas.addEventListener("wheel", this.listeners.wheel)
    this.canvas.addEventListener("mousedown", this.listeners.mousedown)
    this.canvas.addEventListener("mousemove", this.listeners.mousemove)
    this.canvas.addEventListener("mouseup", this.listeners.mouseup)
    this.canvas.addEventListener("contextmenu", this.listeners.contextmenu)
  }

  removeEventListeners() {
    this.canvas.removeEventListener("wheel", this.listeners.wheel)
    this.canvas.removeEventListener("mousedown", this.listeners.mousedown)
    this.canvas.removeEventListener("mousemove", this.listeners.mousemove)
    this.canvas.removeEventListener("mouseup", this.listeners.mouseup)
    this.canvas.removeEventListener("contextmenu", this.listeners.contextmenu)
  }

  mouseOffset(event) {
    return {
      x: event.pageX - this.canvas.offsetLeft,
      y: event.pageY - this.canvas.offsetTop,
    }
  }

  onMouseDown(event) {
    event.preventDefault()
    event.stopPropagation()
    this.dragStart = this.transform.transform(this.mouseOffset(event))
    this.dragging = true
  }

  onMouseMove(event) {
    event.preventDefault()
    event.stopPropagation()

    if (!this.dragging) {
      return
    }

    const offset = this.mouseOffset(event)
    const dragEnd = this.transform.transform(offset)
    const dx = dragEnd.x - this.dragStart.x
    const dy = dragEnd.y - this.dragStart.y
    this.transform.translate(dx, dy)
    this.dirty = true
    this.dragStart = this.transform.transform(offset)
  }

  onMouseUp(event) {
    event.preventDefault()
    event.stopPropagation()

    this.dragging = false
  }

  onWheel(event) {
    event.preventDefault()
    event.stopPropagation()

    const offset = this.mouseOffset(event)
    const t = this.transform.transform(offset)
    this.transform.translate(t.x, t.y)
    const factor =
      Math.sign(event.deltaY) > 0
        ? 1 - this.config.incrementalScale
        : 1 + this.config.incrementalScale
    this.transform.scale(factor)
    this.transform.translate(-t.x, -t.y)
    this.dirty = true
  }

  clearCanvas(color) {
    const { x: left, y: top } = this.transform.transform({
      x: 0,
      y: 0,
    })
    const { x: right, y: bottom } = this.transform.transform({
      x: this.ctx.canvas.width,
      y: this.ctx.canvas.height,
    })
    const width = Math.abs(right - left)
    const height = Math.abs(bottom - top)
    this.ctx.fillStyle = color
    this.ctx.fillRect(left, top, width, height)
  }
}

class Player {
  constructor(x, y, angle, fov) {
    this.x = x
    this.y = y
    this.angle = angle
    this.fov = fov
  }

  moveForward(amount) {
    const angle = (this.angle - 90) * Mathf.DEG_2_RAD
    this.x += Math.sin(angle) * amount
    this.y += Math.cos(angle) * amount
  }

  moveRight(amount) {
    const angle = this.angle * Mathf.DEG_2_RAD
    this.x += Math.sin(angle) * amount
    this.y += Math.cos(angle) * amount
  }

  rotate(amount) {
    this.angle += amount
  }
}

class Mathf {
  static DEG_2_RAD = Math.PI / 180
  static RAD_2_DEG = 180 / Math.PI

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

  readNode(offset) {
    return {
      splitter: {
        x: this.readInt16(offset + 0),
        y: this.readInt16(offset + 2),
        dx: this.readInt16(offset + 4),
        dy: this.readInt16(offset + 6),
      },
      rightBbox: {
        top: this.readInt16(offset + 8),
        bottom: this.readInt16(offset + 10),
        left: this.readInt16(offset + 12),
        right: this.readInt16(offset + 14),
      },
      leftBbox: {
        top: this.readInt16(offset + 16),
        bottom: this.readInt16(offset + 18),
        left: this.readInt16(offset + 20),
        right: this.readInt16(offset + 22),
      },
      rightChild: this.readUint16(offset + 24),
      leftChild: this.readUint16(offset + 26),
    }
  }

  readSubsector(offset) {
    return {
      segCount: this.readUint16(offset + 0),
      firstSegment: this.readUint16(offset + 2),
    }
  }

  readSegment(offset) {
    return {
      startVertex: this.readInt16(offset + 0),
      endVertex: this.readInt16(offset + 2),
      angle: this.readInt16(offset + 4),
      linedef: this.readInt16(offset + 6),
      direction: this.readInt16(offset + 8),
      offset: this.readInt16(offset + 10),
    }
  }

  readInt32(offset) {
    return this.dataView.getInt32(offset, true)
  }

  readInt16(offset) {
    return this.dataView.getInt16(offset, true)
  }

  readUint16(offset) {
    return this.dataView.getUint16(offset, true)
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
    this.nodes = wad.getLumpData(
      this.mapIndex + LUMP_INDICES.NODES,
      (offset) => wad.reader.readNode(offset),
      28
    )
    this.rootNodeIndex = this.nodes.length - 1
    this.subsectors = wad.getLumpData(
      this.mapIndex + LUMP_INDICES.SSECTORS,
      (offset) => wad.reader.readSubsector(offset),
      4
    )
    this.segments = wad.getLumpData(
      this.mapIndex + LUMP_INDICES.SEGS,
      (offset) => wad.reader.readSegment(offset),
      12
    )
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

  rect(x, y, w, h, color) {
    this.ctx.strokeStyle = color
    this.ctx.strokeRect(x, y, w, h)
  }

  rectLegacy(x, y, w, h, color) {
    const lines = [
      { x, y },
      { x: x + w, y },
      { x: x + w, y: y + h },
      { x: x, y: y + h },
    ]

    for (let i = 0, length = lines.length; i < length; i++) {
      const j = (i + 1) % length
      const p1 = lines[i]
      const p2 = lines[j]
      this.line(p1.x, p1.y, p2.x, p2.y, color)
    }
  }

  clear(color) {
    this.ctx.fillStyle = color
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }
}

class MapTopDownRenderer {
  constructor(renderer, wadRuntime) {
    this.renderer = renderer
    this.wad = wadRuntime

    this.padding = 25
    this.playerColors = ["red", "green", "blue", "yellow"]
    this.map = this.calculateMap()

    const SCALE_FACTOR = 3
    this.width = DOOM_WIDTH * SCALE_FACTOR
    this.height = DOOM_HEIGHT * SCALE_FACTOR
  }

  calculateMap() {
    const bounds = this.getBounds()
    const width = bounds.xMax - bounds.xMin
    const height = bounds.yMax - bounds.yMin
    const aspect = width / height

    return {
      bounds,
      width,
      height,
      aspect,
    }
  }

  getBounds() {
    const lastIndex = this.wad.vertexes.length - 1
    const buffer = [...this.wad.vertexes]

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

  drawSplitter(splitter) {
    const v1 = { x: splitter.x, y: splitter.y }
    const v2 = { x: splitter.x + splitter.dx, y: splitter.y + splitter.dy }
    const p1 = this.remapVertex(v1)
    const p2 = this.remapVertex(v2)
    this.renderer.line(p1.x, p1.y, p2.x, p2.y, "blue")
  }

  drawBbox(bbox, color) {
    const p1 = this.remapVertex({ x: bbox.left, y: bbox.top })
    const p2 = this.remapVertex({ x: bbox.right, y: bbox.bottom })
    const width = p2.x - p1.x
    const height = p2.y - p1.y
    this.renderer.rect(p1.x, p1.y, width, height, color)
  }

  drawNode(index) {
    const node = this.wad.nodes[index]
    this.drawBbox(node.rightBbox, "green")
    this.drawBbox(node.leftBbox, "red")
    this.drawSplitter(node.splitter)
  }

  drawSubsector(index, color) {
    const sector = this.wad.subsectors[index]
    for (let i = 0, length = sector.segCount; i < length; i++) {
      this.drawSegment(sector.firstSegment + i, color)
    }
  }

  drawSegment(index, color) {
    const segment = this.wad.segments[index]
    const p1 = this.remapVertex(this.wad.vertexes[segment.startVertex])
    const p2 = this.remapVertex(this.wad.vertexes[segment.endVertex])
    this.renderer.line(p1.x, p1.y, p2.x, p2.y, color)
  }

  drawLines() {
    for (let i = 0, length = this.wad.linedefs.length; i < length; i++) {
      const line = this.wad.linedefs[i]
      const p1 = this.remapVertex(this.wad.vertexes[line.startVertex])
      const p2 = this.remapVertex(this.wad.vertexes[line.endVertex])
      this.renderer.line(p1.x, p1.y, p2.x, p2.y, "orange")
    }
  }

  drawVertexes() {
    for (let i = 0, length = this.wad.vertexes.length; i < length; i++) {
      const vertex = this.wad.vertexes[i]
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
    const thing = this.wad.things[index]
    const point = this.remapVertex(thing)
    this.renderer.circle(point.x, point.y, 2, color)
  }

  drawPlayerAndFov(player, color) {
    const radius = 500

    const angle = player.angle - player.fov * 0.5
    const leftAngle = (angle - 90) * Mathf.DEG_2_RAD
    const rightAngle = angle * Mathf.DEG_2_RAD

    const leftPoint = {
      x: player.x + Math.sin(leftAngle) * radius,
      y: player.y + Math.cos(leftAngle) * radius,
    }
    const rightPoint = {
      x: player.x + Math.sin(rightAngle) * radius,
      y: player.y + Math.cos(rightAngle) * radius,
    }

    const p = this.remapVertex(player)
    const p1 = this.remapVertex(leftPoint)
    const p2 = this.remapVertex(rightPoint)

    this.renderer.circle(p.x, p.y, 5, color)
    this.renderer.line(p.x, p.y, p1.x, p1.y, color)
    this.renderer.line(p.x, p.y, p2.x, p2.y, color)
  }

  remapVertex(vertex) {
    return {
      x: this.remapX(vertex.x),
      y: this.remapY(vertex.y),
    }
  }

  remapX(value) {
    const { xMin, xMax } = this.map.bounds
    const out_min = this.padding
    const out_max = this.width - this.padding
    return Mathf.remap(value, xMin, xMax, out_min, out_max)
  }

  remapY(value) {
    const { yMin, yMax } = this.map.bounds
    const out_min = this.padding
    const height = this.width / this.map.aspect
    const out_max = height - this.padding
    return Mathf.remap(value, yMin, yMax, out_max, out_min)
  }
}

class MapData {
  constructor(wadRuntime) {
    this.wad = wadRuntime
    const thing = wadRuntime.things[0]
    this.player = new Player(thing.x, thing.y, thing.angle, 90)
  }

  pointOnLeftSide(x, y, node) {
    const dx = x - node.splitter.x
    const dy = y - node.splitter.y
    return dx * node.splitter.dy - dy * node.splitter.dx <= 0
  }

  //! R_PointInSubsector
  pointInSubsector(x, y) {
    let nodeIndex = this.wad.rootNodeIndex

    while (!(nodeIndex & SUBSECTOR_IDENTIFIER)) {
      const node = this.wad.nodes[nodeIndex]
      nodeIndex = this.pointOnLeftSide(x, y, node) ? node.leftChild : node.rightChild
    }

    return nodeIndex & ~SUBSECTOR_IDENTIFIER
  }
}

class App {
  constructor(canvas) {
    this.canvas = canvas
    this.panAndZoom = new PanAndZoom(canvas)
    this.panAndZoom.addEventListeners()
  }

  dispose() {
    this.stopRenderLoop()
    this.panAndZoom.removeEventListeners()
  }

  async preload() {
    const response = await fetch("./wad/doom1.wad")
    this.bytes = await response.arrayBuffer()
  }

  create() {
    const wad = new WadData(this.bytes)
    this.wadRuntime = new WadRuntime("E1M1", wad)
    this.renderer = new Renderer(this.canvas)
    this.mapTopDownRenderer = new MapTopDownRenderer(this.renderer, this.wadRuntime)
    this.mapData = new MapData(this.wadRuntime)
  }

  resize(width, height) {
    this.canvas.width = width
    this.canvas.height = height
  }

  renderFrame() {
    this.renderer.clear("black")
    this.panAndZoom.clearCanvas("black")
    this.mapTopDownRenderer.drawLines()
    this.mapTopDownRenderer.drawVertexes()
    this.mapTopDownRenderer.drawDefaultPlayer()

    // for (let i = 0; i < this.wadRuntime.segments.length; i++) {
    //   this.mapTopDownRenderer.drawSegment(i, "blue")
    // }

    const player = this.mapData.player

    const sectorIndex = this.mapData.pointInSubsector(player.x, player.y)
    this.mapTopDownRenderer.drawSubsector(sectorIndex, "blue")

    this.mapTopDownRenderer.drawPlayerAndFov(player, "red")
  }

  renderLoop(time) {
    this.renderFrame()
    this.rafId = requestAnimationFrame(this.renderLoop.bind(this))
  }

  startRenderLoop() {
    this.renderLoop(0)
  }

  stopRenderLoop() {
    cancelAnimationFrame(this.rafId)
  }
}

async function main() {
  const canvas = document.querySelector("canvas")
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  const app = new App(canvas)

  window.addEventListener("resize", () => {
    app.resize(window.innerWidth, window.innerHeight)
  })

  await app.preload()
  app.create()
  app.startRenderLoop()

  const player = app.mapData.player

  const config = {
    angle: 30,
    speed: 150,
  }

  window.addEventListener("keydown", (event) => {
    if (event.repeat) {
      return
    }

    switch (event.code) {
      case "KeyQ":
        player.rotate(-config.angle)
        break
      case "KeyE":
        player.rotate(config.angle)
        break
      case "KeyW":
        player.moveForward(config.speed)
        break
      case "KeyS":
        player.moveForward(-config.speed)
        break
      case "KeyA":
        player.moveRight(-config.speed)
        break
      case "KeyD":
        player.moveRight(config.speed)
        break
    }
  })

  canvas.addEventListener("mousemove", (event) => {
    if (event.ctrlKey) {
      const pos = app.panAndZoom.transform.transform({
        x: event.clientX,
        y: event.clientY,
      })
      //todo: calculate and set player position to follow cursor
    }
  })
}

main()
