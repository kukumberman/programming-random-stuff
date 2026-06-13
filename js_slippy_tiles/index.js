import { EVENT_NAMES, SlippyMap } from "./js/SlippyMap.js"
import { parseHash, parseUrlParams } from "./js/utils.js"

const urlParams = parseUrlParams(window.location.search)

const canvas = document.querySelector("canvas")

const map = new SlippyMap(canvas)
map.tileFunc = urlParams.tileFunc
map.debug = urlParams.debug

map.setView([51.5, -0.09], 19)
map.addMarker([51.5, -0.09])

// https://www.openstreetmap.org/way/26248222
map.addPolyline([
  [51.5001433, -0.0897304], // 287453569
  [51.5001108, -0.0898318], // 6236462763
  [51.500091, -0.0899186], // 287453565
  [51.4998947, -0.0909619], // 848107647
  [51.499862, -0.0910277], // 9855995939
  [51.4998472, -0.0910836], // 9855995939
])

map.events.addEventListener(EVENT_NAMES.MOVEEND, () => {
  const center = map.getCenter()
  const zoom = map.getZoom()
  const decimals = 5
  const lat = center.lat.toFixed(5)
  const lon = center.lon.toFixed(5)
  window.location.hash = `map=${zoom}/${lat}/${lon}`
})

main()

function updateMapLocationFromHash() {
  const state = parseHash(window.location.hash)

  if (state) {
    map.setView([state.lat, state.lon], state.zoom)
  }
}

function renderLoop() {
  map.render()
  window.requestAnimationFrame(renderLoop)
}

function main() {
  window.addEventListener("hashchange", () => {
    updateMapLocationFromHash()
  })

  updateMapLocationFromHash()
  renderLoop()
}
