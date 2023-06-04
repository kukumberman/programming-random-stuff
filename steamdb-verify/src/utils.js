import crypto from "crypto"
import fs from "fs"
import glob from "glob"

/**
 *
 * @typedef {Object} RemoteEntry
 * @property {string} name
 * @property {string} sha1
 */

/**
 *
 * @typedef {Object} LocalEntry
 * @property {string} name
 * @property {string} hash
 */

/**
 *
 * @param {string} algorithm
 * @param {string} path
 * @returns
 */
function checksumFile(algorithm, path) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(algorithm)
    const stream = fs.createReadStream(path)
    stream.on("error", (err) => reject(err))
    stream.on("data", (chunk) => hash.update(chunk))
    stream.on("end", () => resolve(hash.digest("hex")))
  })
}

/**
 *
 * @param {string} baseDirectory
 * @returns {Promise<LocalEntry[]>}
 */
export async function calculateFileHashes(baseDirectory) {
  const files = glob
    .sync("**/**", {
      cwd: baseDirectory,
      withFileTypes: true,
    })
    .filter((entry) => !entry.isDirectory())
    .map((entry) => entry.fullpath())
    .map((filepath) => filepath.replace(/\\/g, "/"))

  // 11 minutes (100-130 mb/s) (17m 2nd attempt)
  const result = await files.reduce(async (acc, item) => {
    const arr = await acc
    const name = item.substring(baseDirectory.length + 1)
    const hash = await checksumFile("sha1", item)
    arr.push({ name, hash })
    return arr
  }, Promise.resolve(new Array()))

  // more than 40 minutes (25-30 mb/s)
  // const result = await Promise.all(
  //   files.map(async (filepath) => {
  //     return {
  //       name: filepath.substring(baseDirectory.length + 1),
  //       sha1: await checksumFile("sha1", filepath),
  //     }
  //   })
  // )

  return result
}

/**
 *
 * @param {RemoteEntry[]} remoteEntries
 * @param {LocalEntry[]} localEntries
 * @returns
 */
export function compare(remoteEntries, localEntries) {
  const remoteEntriesMap = remoteEntries.reduce((acc, item) => {
    acc.set(item.name, item.sha1)
    return acc
  }, new Map())

  const localEntriesMap = localEntries.reduce((acc, item) => {
    acc.set(item.name, item.hash)
    return acc
  }, new Map())

  const entriesWithHashMismatch = []
  const entriesNotFound = []
  const redundantEntries = []

  Array.from(remoteEntriesMap.entries()).forEach(([name, hash]) => {
    if (localEntriesMap.has(name)) {
      if (localEntriesMap.get(name) !== hash) {
        entriesWithHashMismatch.push(name)
      }
    } else {
      entriesNotFound.push(name)
    }
  })

  Array.from(localEntriesMap.entries()).forEach(([name, hash]) => {
    if (!remoteEntriesMap.has(name)) {
      redundantEntries.push(name)
    }
  })

  return {
    entriesWithHashMismatch,
    entriesNotFound,
    redundantEntries,
  }
}
