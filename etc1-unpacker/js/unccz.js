const zlib = require("zlib")

module.exports = {
  ccInflateCCZFile,
}

const CCZ_HEADER_MAGIC = 0x43435a21 // "CCZ!"

/**
 * code was converted by ChatGPT from
 * https://github.com/eminom/unccz/blob/master/unccz/unccz.cpp
 * @param {Buffer} buffer
 * @returns
 */
function ccInflateCCZFile(buffer) {
  const CCZ_COMPRESSION_ZLIB = 0

  const compressed = buffer

  const header = {
    sig: compressed.readUInt32BE(0),
    compression_type: compressed.readUInt16BE(4),
    version: compressed.readUInt16BE(6),
    reserved: compressed.readUInt32BE(8),
    len: compressed.readUInt32BE(12),
  }

  if (header.sig !== CCZ_HEADER_MAGIC) {
    console.log("Invalid CCZ file")
    return null
  }

  // verify header version
  const version = header.version
  if (version > 2) {
    console.log("Unsupported CCZ header format")
    return null
  }

  // verify compression format
  const compression_type = header.compression_type
  if (compression_type !== CCZ_COMPRESSION_ZLIB) {
    console.log("Unsupported compression method")
    return null
  }

  const len = header.len
  const source = compressed.subarray(16)

  try {
    const result = zlib.inflateSync(source, {
      finishFlush: zlib.constants.Z_SYNC_FLUSH,
      chunkSize: len,
    })
    if (result.length !== len) {
      console.log("Failed to uncompress data")
      return null
    }
    return result
  } catch (error) {
    console.log("Failed to uncompress data")
    return null
  }
}
