const selector = ".css-1dbjc4n.r-1awozwy.r-1kihuf0.r-18u37iz.r-1pi2tsx.r-1777fci.r-1pjcn9w.r-xr3zp9.r-1xcajam.r-ipm5af.r-g6jmlv"
const enabledKeyName = "enabled"

function chromeStorageSet(keyName, value) {
  const o = {}
  o[keyName] = value
  chrome.storage.sync.set(o)
}

function chromeStorageGetAsync(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(key, (result) => {
      resolve(result[key])
    })
  })
}

function enable() {
  chromeStorageSet(enabledKeyName, true)
}

function disable() {
  chromeStorageSet(enabledKeyName, false)
}

function remove() {
  const element = document.querySelector(selector)
  if (element) {
    element.parentNode.remove()
    document.documentElement.style = ""
    console.log("😎 removed!")
  }
}

async function intervalAction() {
  const enabled = await chromeStorageGetAsync(enabledKeyName)
  if (enabled === true) {
    remove()
  }
}

async function main() {
  const enabled = await chromeStorageGetAsync(enabledKeyName)
  if (enabled === undefined) {
    chromeStorageSet(enabledKeyName, true)
  }
  setInterval(intervalAction, 1000)
}

main()
