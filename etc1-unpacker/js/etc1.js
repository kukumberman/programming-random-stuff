const ETC_PKM_HEADER_SIZE = 16
const ETC1_PKM_FORMAT_OFFSET = 6
const ETC1_PKM_ENCODED_WIDTH_OFFSET = 8
const ETC1_PKM_ENCODED_HEIGHT_OFFSET = 10
const ETC1_PKM_WIDTH_OFFSET = 12
const ETC1_PKM_HEIGHT_OFFSET = 14
const ETC1_RGB_NO_MIPMAPS = 0
const ETC1_PKM_HEADER_MAGIC = 0x504b4d20 // "PKM "
const ETC1_PKM_HEADER_MAGIC_10 = 0x3130 // "10"

class Etc1Header {
  /**
   *
   * @param {Buffer} buffer
   */
  constructor(buffer) {
    if (buffer.length < ETC_PKM_HEADER_SIZE) {
      throw new Error("Invalid header buffer size")
    }

    if (
      !(
        buffer.readUInt32BE(0) === ETC1_PKM_HEADER_MAGIC &&
        buffer.readUInt16BE(4) === ETC1_PKM_HEADER_MAGIC_10
      )
    ) {
      throw new Error("Not an PKM valid format")
    }

    this.buffer = buffer

    this.format = buffer.readUInt16BE(ETC1_PKM_FORMAT_OFFSET)
    this.encodedWidth = buffer.readUInt16BE(ETC1_PKM_ENCODED_WIDTH_OFFSET)
    this.encodedHeight = buffer.readUInt16BE(ETC1_PKM_ENCODED_HEIGHT_OFFSET)
    this.width = buffer.readUInt16BE(ETC1_PKM_WIDTH_OFFSET)
    this.height = buffer.readUInt16BE(ETC1_PKM_HEIGHT_OFFSET)
  }

  /**
   * this is needed in case you are using "etc1tool" to convert pkm to png
   */
  fix() {
    this.buffer.writeUInt16BE(this.encodedWidth, ETC1_PKM_WIDTH_OFFSET)
    this.buffer.writeUInt16BE(this.encodedHeight, ETC1_PKM_HEIGHT_OFFSET)
  }
}

/**
 * https://android.googlesource.com/platform/frameworks/native/+/master/opengl/libs/ETC1/etc1.cpp#642
 * @param {Buffer} header
 */
function etc1_pkm_is_valid(header) {
  if (
    header.readUInt32BE(0) != ETC1_PKM_HEADER_MAGIC &&
    header.readUInt16BE(4) != ETC1_PKM_HEADER_MAGIC_10
  ) {
    return false
  }

  const format = header.readUInt16BE(ETC1_PKM_FORMAT_OFFSET)
  const encodedWidth = header.readUInt16BE(ETC1_PKM_ENCODED_WIDTH_OFFSET)
  const encodedHeight = header.readUInt16BE(ETC1_PKM_ENCODED_HEIGHT_OFFSET)
  const width = header.readUInt16BE(ETC1_PKM_WIDTH_OFFSET)
  const height = header.readUInt16BE(ETC1_PKM_HEIGHT_OFFSET)

  const validFormat = format == ETC1_RGB_NO_MIPMAPS
  const validWidth = encodedWidth >= width && encodedWidth - width < 4
  const validHeight = encodedHeight >= height && encodedHeight - height < 4

  return validFormat && validWidth && validHeight
}

module.exports = {
  Etc1Header,
  etc1_pkm_is_valid,
}

/*
// prettier-ignore
const bytes = [
  0x50, 0x4b, 0x4d, 0x20, 0x31, 0x30, 0x00, 0x00,
  0x08, 0x00, 0x08, 0x00, 0x08, 0x00, 0x04, 0x00
]

const buffer = Buffer.from(new Uint8Array(bytes))
console.log("header", etc1_pkm_is_valid(buffer))
*/
