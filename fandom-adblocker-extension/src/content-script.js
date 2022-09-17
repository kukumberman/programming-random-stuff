const selectors = [
  "#incontent_player",
  "#top_boxad",
  "#incontent_boxad_1",
  ".top-ads-container",
  ".bottom-ads-container",
]

function remove() {
  selectors
    .map(selector => document.querySelector(selector))
    .forEach(element => {
      if (element) {
        element.remove()
      }
    })
}

setTimeout(() => {
  remove()
  console.log("😎 removed!")
}, 1000)
