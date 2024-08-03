const contextOptionIds = {
  writeElementToClipboard: "writeElementToClipboard",
  includePrettyPrice: "includePrettyPrice",
}

chrome.runtime.onInstalled.addListener(() => {
  const initialState = {
    includePrettyPrice: false,
  }

  chrome.contextMenus.create({
    id: contextOptionIds.writeElementToClipboard,
    title: "Write element to clipboard",
    contexts: [chrome.contextMenus.ContextType.ALL],
  })
  chrome.contextMenus.create({
    id: contextOptionIds.includePrettyPrice,
    title: "Include pretty price",
    contexts: [chrome.contextMenus.ContextType.ALL],
    type: "checkbox",
    checked: initialState.includePrettyPrice,
  })

  writeToLocalStorage(contextOptionIds.includePrettyPrice, initialState.includePrettyPrice)
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log(info, tab)

  if (info.menuItemId === contextOptionIds.writeElementToClipboard) {
    chrome.tabs.sendMessage(
      tab.id,
      "getClickedElement",
      { frameId: info.frameId },
      onItemReceived(info, tab)
    )
  } else if (info.menuItemId == contextOptionIds.includePrettyPrice) {
    writeToLocalStorage(contextOptionIds.includePrettyPrice, info.checked)
  }
})

function onItemReceived(info, tab) {
  return async (item) => {
    const includePrettyPrice = await getFromLocalStorage(contextOptionIds.includePrettyPrice)

    if (includePrettyPrice === false) {
      delete item.prettyPrice
    }

    const text = JSON.stringify(item, null, 2)

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: writeToClipboard,
      args: [text],
    })
  }
}

function writeToClipboard(text) {
  navigator.clipboard.writeText(text)
}

function writeToLocalStorage(key, value) {
  return chrome.storage.local.set({ [key]: value })
}

async function getFromLocalStorage(key) {
  const obj = await chrome.storage.local.get(key)
  return obj[key]
}
