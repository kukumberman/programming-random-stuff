export class SlippyMap {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext("2d")

    this.tileSize = 256

    this.zoom = 10

    this.center = this.project(51.509865, -0.118092, this.zoom)

    this.tiles = new Map()

    this.dragging = false

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

    this.resize()

    this.installEvents()
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
      this.lastX = e.clientX
      this.lastY = e.clientY
    })

    window.addEventListener("mouseup", () => {
      this.dragging = false
    })

    window.addEventListener("mousemove", (e) => {
      if (!this.dragging) return

      const dx = e.clientX - this.lastX
      const dy = e.clientY - this.lastY

      this.lastX = e.clientX
      this.lastY = e.clientY

      this.center.x -= dx
      this.center.y -= dy

      this.clampCenter()
    })

    this.canvas.addEventListener("click", (evt) => {
      if (!evt.ctrlKey) return
      const rect = this.canvas.getBoundingClientRect()
      const mx = evt.clientX - rect.left
      const my = evt.clientY - rect.top
      const worldX = this.center.x + mx - this.canvas.width / 2
      const worldY = this.center.y + my - this.canvas.height / 2
      const { lat, lon } = this.unproject(worldX, worldY, this.zoom)
      const url = `https://maps.google.com/?q=${lat},${lon}`
      console.log([lat, lon])
      console.log(url)
      window.open(url, "_blank")
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

  tileKey(z, x, y) {
    return `${z}/${x}/${y}`
  }

  getTile(z, x, y) {
    const key = this.tileKey(z, x, y)

    if (this.tiles.has(key)) return this.tiles.get(key)

    const img = new Image()

    img.crossOrigin = "anonymous"

    img.src = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`

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

  render() {
    const width = this.canvas.width
    const height = this.canvas.height

    this.ctx.clearRect(0, 0, width, height)

    const left = Math.floor(this.center.x - width / 2)
    const top = Math.floor(this.center.y - height / 2)

    const right = left + width
    const bottom = top + height

    const tileSize = this.tileSize

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

        if (!img.complete) continue

        const sx = tx * tileSize - left
        const sy = ty * tileSize - top

        this.ctx.drawImage(img, sx, sy, tileSize, tileSize)
      }
    }

    for (const marker of this.markers) {
      const pos = this.project(marker.lat, marker.lon, this.zoom)
      const sx = pos.x - this.center.x + width / 2
      const sy = pos.y - this.center.y + height / 2
      if (marker.img.complete) {
        marker.img.style.transform = `translate(${sx - marker.img.naturalWidth / 2}px, ${sy - marker.img.naturalHeight}px)`
      }
    }
  }

  renderLoop() {
    this.render()
    requestAnimationFrame(() => this.renderLoop())
  }

  addMarker(coords) {
    const [lat, lon] = coords
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png"
    img.style.position = "absolute"
    img.style.willChange = "transform"
    this.markerContainer.appendChild(img)
    this.markers.push({ lat, lon, img })
  }

  beginRenderLoop() {
    requestAnimationFrame(() => this.renderLoop())
  }
}
