import fs from "fs"
import { parseArgs } from "node:util"
import { calculateFileHashes, compare } from "./utils.js"
import JSON5 from "json5"

/**
 *
 * @typedef {Object} AppConfig
 * @property {string} baseDirectory
 * @property {string[]} steamdb
 * @property {string} local
 * @property {string} output
 */

class App {
  /**
   *
   * @param {AppConfig} config
   */
  constructor(config) {
    this.config = config
  }

  async calculateLocalFileHashesAndSaveToFile() {
    const result = await calculateFileHashes(this.config.baseDirectory)
    fs.writeFileSync(this.config.local, JSON.stringify(result, null, 2))
  }

  async compareEntriesAndSaveToFile() {
    const localEntries = JSON.parse(fs.readFileSync(this.config.local))

    const remoteEntries = this.config.steamdb
      .map((filepath) => JSON.parse(fs.readFileSync(filepath)))
      .reduce((acc, item) => {
        acc.push(...item)
        return acc
      }, [])

    const result = compare(remoteEntries, localEntries)
    fs.writeFileSync(this.config.output, JSON.stringify(result, null, 2))
  }
}

async function main() {
  console.time("main")

  const args = parseArgs({
    options: {
      compare: {
        type: "boolean",
        default: false,
        multiple: false,
      },
      calculate: {
        type: "boolean",
        default: false,
        multiple: false,
      },
      config: {
        type: "string",
        multiple: false,
      },
    },
  })

  console.log(args.values)

  const pathToConfig = args.values.config !== undefined ? args.values.config : "./config.json"
  const config = JSON5.parse(fs.readFileSync(pathToConfig))

  const app = new App(config)

  if (args.values.calculate === true) {
    await app.calculateLocalFileHashesAndSaveToFile()
  }

  if (args.values.compare === true) {
    await app.compareEntriesAndSaveToFile()
  }

  console.timeEnd("main")
}

main()
