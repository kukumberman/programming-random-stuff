export function tileserver(port) {
  return (z, x, y) => {
    return `http://localhost:${port}/data/map/${z}/${x}/${y}.png`
  }
}

export function openstreetmap(z, x, y) {
  return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`
}

export const mapgenie = {
  /**
   * zoom level [8, 14]
   */
  gtasa(index) {
    const entries = [
      ["atlas-v1", "png"],
      ["satellite-v1", "jpg"],
    ]
    const [prefix, ext] = entries[index]
    return (z, x, y) => {
      return `https://tiles.mapgenie.io/games/grand-theft-auto-san-andreas/san-andreas/${prefix}/${z}/${x}/${y}.${ext}`
    }
  },

  /**
   * zoom level [8, 13]
   */
  gtavc(index) {
    const entries = [["radar-v1"], ["atlas-v1"], ["classic-v1"]]
    const [prefix] = entries[index]
    return (z, x, y) => {
      return `https://tiles.mapgenie.io/games/grand-theft-auto-vice-city/vice-city/${prefix}/${z}/${x}/${y}.png`
    }
  },

  /**
   * zoom level [8, 14]
   */
  gta3(index) {
    const entries = [["atlas-v2"], ["classic-v1"], ["radar-v2"]]
    const [prefix] = entries[index]
    return (z, x, y) => {
      return `https://tiles.mapgenie.io/games/grand-theft-auto-3/liberty-city/${prefix}/${z}/${x}/${y}.png`
    }
  },

  /**
   * zoom level [8, 15]
   */
  gta4() {
    return (z, x, y) => {
      return `https://tiles.mapgenie.io/games/gta-4/liberty-city/radar-v1/${z}/${x}/${y}.png`
    }
  },

  /**
   * zoom level [1, 7]
   */
  gta5(index) {
    const entries = [
      ["atlas", "png"],
      ["satellite", "png"],
      ["road", "png"],
      ["uv", "jpg"],
    ]
    const [prefix, ext] = entries[index]
    return (z, x, y) => {
      return `https://tiles.mapgenie.io/games/gta5/los-santos/${prefix}/${z}/${x}/${y}.${ext}`
    }
  },

  /**
   * zoom level [1, 7]
   */
  rdr2(index) {
    const entries = [
      ["atlas-v1", "jpg"],
      ["atlas-dark-v1", "jpg"],
    ]
    const [prefix, ext] = entries[index]
    return (z, x, y) => {
      return `https://tiles.mapgenie.io/games/rdr2/world/${prefix}/${z}/${x}/${y}.${ext}`
    }
  },

  /**
   * zoom level [8, 15]
   */
  gzw(index) {
    const entries = [
      ["default-v1", "jpg"],
      ["default-v2", "jpg"],
      ["default-v3", "jpg"],
      ["default-v4", "jpg"],
    ]
    const [prefix, ext] = entries[index]
    return (z, x, y) => {
      return `https://tiles.mapgenie.io/games/gray-zone-warfare/lamang-island/${prefix}/${z}/${y}/${x}.${ext}`
    }
  },
}

/**
 * zoom level [11, 19]
 */
export function gzwtacmap() {
  const prefix = "0.4"
  return (z, x, y) => {
    return `https://cdn.gzwtacmap.com/${prefix}/lamang/${z}/${x}/${y}.png`
  }
}
