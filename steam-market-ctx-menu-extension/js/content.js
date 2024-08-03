function logExtension() {
  const manifest = chrome.runtime.getManifest()
  console.log(`${manifest.name} is running`)
}

logExtension()

let clickedItem = null

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log(request, sender, sendResponse)

  if (request == "getClickedElement") {
    sendResponse(clickedItem)
  }
})

document.addEventListener("contextmenu", (evt) => {
  const clickedElement = evt.target
  const market_listing_row_link = clickedElement.closest(".market_listing_row_link")

  if (market_listing_row_link !== null) {
    const imgElement = market_listing_row_link.querySelector("img")
    const nameElement = market_listing_row_link.querySelector(".market_listing_item_name")
    const priceElement = market_listing_row_link.querySelector(".normal_price[data-price]")

    const url = imgElement.src
    const urlWithNoSize = url.replace("/62fx62f", "")

    const item = {
      url: urlWithNoSize,
      name: nameElement.textContent,
      price: +priceElement.getAttribute("data-price"),
      prettyPrice: priceElement.textContent,
    }
    console.log(item)

    clickedItem = item
  }
})
