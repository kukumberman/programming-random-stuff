/**
 * 
 * @param {HTMLImageElement} img 
 * @returns 
 */
function loadImageAsync(img) {
  return new Promise((resolve, reject) => {
    if (img.complete) {
      resolve()
    }
    else {
      img.addEventListener("load", () => {
        resolve()
      }, { once: true })
    }
  })
}

/**
 * 
 * @param {HTMLImageElement} img 
 * @returns 
 */
function imageToBlobAsync(img) {
  const canvas = document.createElement("canvas")
  canvas.width = img.clientWidth
  canvas.height = img.clientHeight
  const ctx = canvas.getContext("2d")
  ctx.drawImage(img, 0, 0)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      resolve(blob)
    }, "image/png")
  })
}

async function main() {
  const response = await fetch("./images.txt")
  const text = await response.text()
  const lines = text.split("\n").filter(str => str.length > 0)

  const promises = lines.map(async (line) => {
    const imageFilename = line.trim()
    const img = document.createElement("img")
    img.src = `./images/${imageFilename}`
    img.setAttribute("name", imageFilename)
    document.body.appendChild(img)
    await loadImageAsync(img)
    img.setAttribute("width", img.clientWidth)
    img.setAttribute("height", img.clientHeight)
    return img
  })

  const images = await Promise.all(promises)

  const zip = new JSZip()
  await Promise.all(images.map(async (img) => {
    const blob = await imageToBlobAsync(img)
    const name = img.getAttribute("name")
    const filename = name.replace(".svg", ".png")
    zip.file(filename, blob)
  }))

  if (confirm("Generate zip archive?")) {
    const content = await zip.generateAsync({ type:"blob" })
    saveAs(content, "images.zip");
  }
}

main()
