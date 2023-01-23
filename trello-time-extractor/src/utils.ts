export function prettyTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minunes = totalMinutes % 60

  if (hours > 0 && minunes > 0) {
    return `${hours}h ${minunes}m`
  }

  if (hours > 0) {
    return `${hours}h`
  }

  return `${minunes}m`
}

export function extractTime(str: string): number {
  const r1 = new RegExp(/\[(.*?)\]/)
  if (!r1.test(str)) {
    return 0
  }

  const timeStr = r1.exec(str)![1]

  const rh = new RegExp(/(\d+)h/)
  const rm = new RegExp(/(\d+)m/)

  const hours = rh.test(timeStr) ? +rh.exec(timeStr)![1] : 0
  const minutes = rm.test(timeStr) ? +rm.exec(timeStr)![1] : 0

  const total = hours * 60 + minutes

  return total
}
