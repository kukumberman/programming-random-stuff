const fs = require("fs")
const path = require("path")
const glob = require("glob")
const { ccInflateCCZFile } = require("./unccz.js")
const { Etc1Header } = require("./etc1.js")

const baseDirectory = "./textures/ccz"
const saveDirectory = path.resolve("./textures/pkm")

const result = glob.sync("**/*.pkm.ccz", {
  cwd: baseDirectory,
})

if (!fs.existsSync(saveDirectory)) {
  fs.mkdirSync(saveDirectory, { recursive: true })
}

result.forEach((relativeFilePath) => {
  const absoluteFilePath = path.join(baseDirectory, relativeFilePath)
  const compressedBytes = fs.readFileSync(absoluteFilePath)
  const decompressedBytes = ccInflateCCZFile(compressedBytes)
  const pathData = path.parse(relativeFilePath)
  const absoluteFileSaveDirectory = path.join(saveDirectory, pathData.dir)
  const absoluteFileSavePath = path.join(absoluteFileSaveDirectory, pathData.name)

  if (!fs.existsSync(absoluteFileSaveDirectory)) {
    fs.mkdirSync(absoluteFileSaveDirectory, { recursive: true })
  }

  const header = new Etc1Header(decompressedBytes)
  header.fix()

  fs.writeFileSync(absoluteFileSavePath, decompressedBytes)
})
