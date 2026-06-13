export function tileserver(port) {
  return (z, x, y) => {
    return `http://localhost:${port}/data/map/${z}/${x}/${y}.png`
  }
}

export function openstreetmap(z, x, y) {
  return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`
}
