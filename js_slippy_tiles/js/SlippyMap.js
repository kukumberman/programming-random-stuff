export const EVENT_NAMES = Object.freeze({
  MOVEEND: "moveend",
})

export class SlippyMap {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext("2d")

    this.tileSize = 256

    this.zoom = 10

    this.center = this.project(51.509865, -0.118092, this.zoom)

    this.tiles = new Map()

    this.dragging = false
    this.last = {
      x: 0,
      y: 0,
    }

    this.debug = true

    this.tileFunc = (z, x, y) => {
      console.log(`Requested tile at ${z}/${x}/${y}`)
      return ""
    }

    this.markerContainer = document.createElement("div")
    this.markerContainer.style.position = "absolute"
    this.markerContainer.style.top = "0"
    this.markerContainer.style.left = "0"
    this.markerContainer.style.width = "100%"
    this.markerContainer.style.height = "100%"
    this.markerContainer.style.pointerEvents = "none"
    this.markerContainer.style.overflow = "hidden"
    canvas.parentNode.insertBefore(this.markerContainer, canvas.nextSibling)

    this.markers = []
    this.polylines = []

    this.resize()

    this.installEvents()

    this.events = new EventTarget()
  }

  setView(coords, zoom) {
    this.zoom = zoom
    this.center = this.project(coords[0], coords[1], this.zoom)
  }

  resize() {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }

  worldSize(z) {
    return this.tileSize * (1 << z)
  }

  project(lat, lon, zoom) {
    const scale = this.worldSize(zoom)

    const x = ((lon + 180) / 360) * scale

    const sinLat = Math.sin((lat * Math.PI) / 180)

    const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale

    return { x, y }
  }

  unproject(x, y, zoom) {
    const scale = this.worldSize(zoom)

    const lon = (x / scale) * 360 - 180

    const n = Math.PI - (2 * Math.PI * y) / scale

    const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)))

    return { lat, lon }
  }

  installEvents() {
    window.addEventListener("resize", () => this.resize())

    this.canvas.addEventListener("mousedown", (e) => {
      this.dragging = true
      this.last.x = e.clientX
      this.last.y = e.clientY
    })

    window.addEventListener("mouseup", () => {
      this.dragging = false
    })

    window.addEventListener("mousemove", (e) => {
      if (!this.dragging) return

      const dx = e.clientX - this.last.x
      const dy = e.clientY - this.last.y

      this.last.x = e.clientX
      this.last.y = e.clientY

      this.center.x -= dx
      this.center.y -= dy

      this.clampCenter()
    })

    this.canvas.addEventListener("click", (evt) => {
      if (!evt.ctrlKey) return
      const rect = this.canvas.getBoundingClientRect()
      const mx = evt.clientX - rect.left
      const my = evt.clientY - rect.top
      const { lat, lon } = this.pixelToLatLon(mx, my)
      const url = `https://maps.google.com/?q=${lat},${lon}`
      console.log([lat, lon])
      console.log(url)
      // window.open(url, "_blank")
    })

    this.canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault()

        const oldZoom = this.zoom

        let newZoom = oldZoom + (e.deltaY < 0 ? 1 : -1)

        newZoom = Math.max(1, Math.min(19, newZoom))

        if (newZoom === oldZoom) return

        const rect = this.canvas.getBoundingClientRect()

        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top

        const left = this.center.x - this.canvas.width / 2
        const top = this.center.y - this.canvas.height / 2

        const worldX = left + mx
        const worldY = top + my

        const factor = Math.pow(2, newZoom - oldZoom)

        const newWorldX = worldX * factor
        const newWorldY = worldY * factor

        this.zoom = newZoom

        this.center.x = newWorldX - mx + this.canvas.width / 2
        this.center.y = newWorldY - my + this.canvas.height / 2

        this.clampCenter()
      },
      { passive: false }
    )
  }

  pixelToLatLon(x, y) {
    const worldX = this.center.x + x - this.canvas.width / 2
    const worldY = this.center.y + y - this.canvas.height / 2
    return this.unproject(worldX, worldY, this.zoom)
  }

  tileKey(z, x, y) {
    return `${z}/${x}/${y}`
  }

  getTile(z, x, y) {
    const key = this.tileKey(z, x, y)

    if (this.tiles.has(key)) return this.tiles.get(key)

    const img = new Image()

    img.crossOrigin = "anonymous"
    img.src = this.tileFunc(z, x, y)

    this.tiles.set(key, img)

    return img
  }

  clampCenter() {
    const world = this.worldSize(this.zoom)

    const minY = this.canvas.height / 2
    const maxY = world - this.canvas.height / 2

    if (minY > maxY) {
      this.center.y = world / 2
      return
    }

    this.center.y = Math.max(minY, Math.min(maxY, this.center.y))
  }

  getCenter() {
    return this.pixelToLatLon(this.canvas.width * 0.5, this.canvas.height * 0.5)
  }

  getZoom() {
    return this.zoom
  }

  render() {
    const width = this.canvas.width
    const height = this.canvas.height

    this.ctx.clearRect(0, 0, width, height)

    const left = Math.floor(this.center.x - width / 2)
    const top = Math.floor(this.center.y - height / 2)

    const right = left + width
    const bottom = top + height

    const tileSize = this.tileSize
    const tileHalfSize = tileSize / 2

    const tileX0 = Math.floor(left / tileSize)
    const tileY0 = Math.floor(top / tileSize)

    const tileX1 = Math.floor(right / tileSize)
    const tileY1 = Math.floor(bottom / tileSize)

    // If `right` lands exactly on a tile boundary, you'll draw one extra column.
    // Many implementations use:
    // const tileX1 = Math.ceil(right / tileSize) - 1
    // const tileY1 = Math.ceil(bottom / tileSize) - 1

    const maxTiles = 1 << this.zoom

    for (let tx = tileX0; tx <= tileX1; tx++) {
      for (let ty = tileY0; ty <= tileY1; ty++) {
        if (ty < 0 || ty >= maxTiles) continue

        const wrappedX = ((tx % maxTiles) + maxTiles) % maxTiles

        const img = this.getTile(this.zoom, wrappedX, ty)

        const notLoadedYet = !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0

        const sx = tx * tileSize - left
        const sy = ty * tileSize - top

        if (!notLoadedYet) {
          this.ctx.drawImage(img, sx, sy, tileSize, tileSize)
        }

        if (this.debug) {
          this.renderDebugTile(sx, sy, wrappedX, ty)
        }
      }
    }

    for (const poly of this.polylines) {
      const pts = poly.coords.map(([lat, lon]) => {
        const p = this.project(lat, lon, this.zoom)
        return {
          x: p.x - this.center.x + width / 2,
          y: p.y - this.center.y + height / 2,
        }
      })
      if (pts.length < 2) continue
      this.ctx.beginPath()
      this.ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) {
        this.ctx.lineTo(pts[i].x, pts[i].y)
      }
      this.ctx.strokeStyle = "#FF6200"
      this.ctx.lineWidth = 4
      this.ctx.lineJoin = "round"
      this.ctx.lineCap = "round"
      this.ctx.stroke()
    }

    for (const marker of this.markers) {
      const pos = this.project(marker.lat, marker.lon, this.zoom)
      const sx = pos.x - this.center.x + width / 2
      const sy = pos.y - this.center.y + height / 2
      if (marker.img.complete) {
        marker.img.style.transform = `translate(${sx - marker.img.naturalWidth / 2}px, ${sy - marker.img.naturalHeight}px)`
      }
    }

    this.events.dispatchEvent(new CustomEvent(EVENT_NAMES.MOVEEND))
  }

  addPolyline(coords) {
    const poly = { coords }
    poly.remove = () => {
      const idx = this.polylines.indexOf(poly)
      if (idx !== -1) this.polylines.splice(idx, 1)
    }
    this.polylines.push(poly)
    return poly
  }

  addMarker(coords) {
    const [lat, lon] = coords
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png"
    img.style.position = "absolute"
    img.style.willChange = "transform"
    this.markerContainer.appendChild(img)
    const marker = { lat, lon, img }
    marker.remove = () => {
      img.remove()
      const idx = this.markers.indexOf(marker)
      if (idx !== -1) this.markers.splice(idx, 1)
    }
    this.markers.push(marker)
    return marker
  }

  // https://docs.maptiler.com/google-maps-coordinates-tile-bounds-projection/
  // https://labs.maptiler.com/showcase/tiles-map-demo/
  renderDebugTile(sx, sy, tx, ty) {
    const tileSize = this.tileSize
    const tileHalfSize = tileSize / 2

    const text = `Google: (${tx},${ty})\nZoom ${this.zoom}`
    const flag = (tx + ty) % 2 === 0
    const tileColor = flag ? "transparent" : "rgba(0, 0, 0, 0.34)"

    this.ctx.save()

    this.ctx.fillStyle = tileColor
    this.ctx.fillRect(sx, sy, tileSize, tileSize)

    this.ctx.shadowColor = "rgba(0, 0, 0, 0.2)"
    this.ctx.shadowBlur = 2
    this.ctx.shadowOffsetX = 2
    this.ctx.shadowOffsetY = 2

    this.ctx.font = "18px Arial"
    this.ctx.textAlign = "center"
    this.ctx.textBaseline = "middle"

    this.ctx.lineWidth = 4
    this.ctx.strokeStyle = "rgba(0, 0, 0, 0.69)"
    this.ctx.strokeText(text, sx + tileHalfSize, sy + tileHalfSize)

    this.ctx.fillStyle = "white"
    this.ctx.fillText(text, sx + tileHalfSize, sy + tileHalfSize)

    this.ctx.restore()
  }
}
