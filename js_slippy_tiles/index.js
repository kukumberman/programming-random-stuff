import { SlippyMap } from "./js/SlippyMap.js"

const canvas = document.querySelector("canvas")

const map = new SlippyMap(canvas)
map.addMarker([51.5, -0.09])
map.beginRenderLoop()
