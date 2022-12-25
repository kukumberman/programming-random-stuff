const fs = require("fs")
const path = require("path")

/**
 * 
 * @param {Buffer} bytes 
 * @param {string} text 
 * @returns 
 */
function appendTextToBuffer(bytes, text) {
  const newBytes = Buffer.from(text)
  const mergedBytes = Buffer.concat([bytes, newBytes])
  return mergedBytes
}

/**
 * 
 * @param {Buffer} bytes 
 */
function readExtraBufferFromImage(bytes) {
  const endOfImageSignature = new Uint8Array([0xff, 0xd9])
  const signatureOffset = bytes.indexOf(endOfImageSignature)
  if (signatureOffset === -1) {
    throw "End of image not found"
  }
  const startIndex = signatureOffset + endOfImageSignature.byteLength
  const content = bytes.subarray(startIndex)
  return content
}

/**
 * 
 * @param {string} pathToFile 
 * @param {string} text 
 */
function appendTextToNewImage(pathToFile, text) {
  if (!fs.existsSync(pathToFile)) {
    const absPath = path.isAbsolute(pathToFile) ? pathToFile : path.resolve(pathToFile)
    throw `File not found (${absPath})`
  }

  const marker = "$"
  
  const bytes = fs.readFileSync(pathToFile)
  const fileBytes = appendTextToBuffer(bytes, text)
  
  const { dir, ext, name } = path.parse(pathToFile)
  const newFileName = `${name}.${marker}${ext}`
  const savePath = path.join(dir, newFileName)
  
  fs.writeFileSync(savePath, fileBytes)
  return savePath
}

/**
 * 
 * @param {string} pathToFile 
 */
function readExtraFromImage(pathToFile) {
  if (!fs.existsSync(pathToFile)) {
    throw "File not found"
  }
  const bytes = fs.readFileSync(pathToFile)
  const content = readExtraBufferFromImage(bytes)
  const str = content.toString()
  return str
}

function main() {
  const newImagePath = appendTextToNewImage("./resources/image.jpg", "Hello, World!")
  const extraData = readExtraFromImage(newImagePath)
  console.log(extraData)
}

main()
