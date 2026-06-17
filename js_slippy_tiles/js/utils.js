import { openstreetmap, tileserver, mapgenie, gzwtacmap } from "./tiles.js"

export function parseHash(locationHash) {
  const match = locationHash.match(/^#map=(\d+)\/(-?\d+\.?\d*)\/(-?\d+\.?\d*)$/)

  if (!match) return null

  return {
    zoom: Number(match[1]),
    lat: Number(match[2]),
    lon: Number(match[3]),
  }
}

export function parseUrlParams(locationSeach) {
  const tilesMap = new Map(
    Object.entries({
      osm: openstreetmap,
      openstreetmap: openstreetmap,
      tileserver: tileserver(8080),
      gtasa: mapgenie.gtasa(0),
      gtavc: mapgenie.gtavc(2),
      gta3: mapgenie.gta3(1),
      gta4: mapgenie.gta4(),
      gta5: mapgenie.gta5(0),
      rdr2: mapgenie.rdr2(1),
      gzw: mapgenie.gzw(3),
      gzwtacmap: gzwtacmap(),
    })
  )
  const defaultTileFunc = openstreetmap

  const urlParams = new URLSearchParams(locationSeach)
  const debugAsString = urlParams.get("debug")?.toLowerCase()

  const find = () => {
    const tiles = urlParams.get("tiles")
    if (tiles === null) {
      return defaultTileFunc
    }

    const func = tilesMap.get(tiles)
    if (func !== undefined) {
      return func
    }

    return defaultTileFunc
  }

  const params = {
    debug: debugAsString === "true",
    tileFunc: find(),
  }
  return params
}
