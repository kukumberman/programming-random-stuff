const fs = require("fs")

class DRG {
  constructor(save_bytes) {
    this.save_bytes = save_bytes
    const season_guids = [
      "A47D407EC0E4364892CE2E03DE7DF0B3",
      "B860B55F1D1BB54D8EE2E41FDA9F5838",
      "D8810F6C76D374419AE6A18EF5B3BA26",
      "0A3AE2198CA5B649B56E4E11D6762AC6",
    ]
    const currentSeasonIndex = 3
    this.season_guid = season_guids[currentSeasonIndex]
    this.season_xp_offset = 48
    this.scrip_offset = 88
    this.perk_offset = 36
  }

  static from_file(save_path) {
    return new DRG(fs.readFileSync(save_path))
  }

  get_season_data() {
    const season_xp_marker = Buffer.from(this.season_guid, "hex")
    const season_data_pos = this.save_bytes.indexOf(season_xp_marker)
  
    if (season_data_pos === -1) {
      throw new Error()
    }
  
    return {
      xp: this.save_bytes.readInt32LE(season_data_pos + this.season_xp_offset),
      scrip: this.save_bytes.readInt32LE(season_data_pos + this.scrip_offset)
    }
  }

  write_season_data(xp, scrip) {
    const season_xp_marker = Buffer.from(this.season_guid, "hex")
    const season_data_pos = this.save_bytes.indexOf(season_xp_marker)
  
    if (season_data_pos === -1) {
      throw new Error()
    }

    this.save_bytes.writeInt32LE(xp, season_data_pos + this.season_xp_offset)
    this.save_bytes.writeInt32LE(scrip, season_data_pos + this.scrip_offset)
  }

  get_perk_points() {
    const perk_marker = Buffer.from("PerkPoints")
    const perk_pos = this.save_bytes.indexOf(perk_marker)

    if (perk_pos === -1) {
      throw new Error()
    }

    return this.save_bytes.readInt32LE(perk_pos + this.perk_offset)
  }

  save_to(file_path) {
    fs.writeFileSync(file_path, this.save_bytes)
  }
}

const SAVE_PATH = "D:/Steam/steamapps/common/Deep Rock Galactic/FSD/Saved/SaveGames/<STEAM_ID>_Player.sav"

function calculateNextXp(currentXp) {
  const XP_PER_LEVEL = 5000
  const XP_THRESHOLD = 146
  const amountToAdd = XP_PER_LEVEL - XP_THRESHOLD - (currentXp % XP_PER_LEVEL)
  return currentXp + amountToAdd
}

function calculateNextXpLazy(currentXp) {
  const XP_PER_LEVEL = 5000
  const skipLevelCount = 10
  const amountToAdd = XP_PER_LEVEL * skipLevelCount
  return currentXp + amountToAdd
}

function main() {
  if (!fs.existsSync(SAVE_PATH)) {
    throw new Error("Save file doesn't exist, provide valid path")
  }

  const drg = DRG.from_file(SAVE_PATH)

  const season_data = drg.get_season_data()

  console.log(drg.get_perk_points())
  console.log(season_data)

  const { xp, scrip } = season_data
  const next_xp = calculateNextXp(xp)
  const next_scrip = scrip + 1
  
  drg.write_season_data(next_xp, next_scrip)

  console.log(new DRG(drg.save_bytes).get_season_data())

  drg.save_to(SAVE_PATH)
}

main()
