const selector = ".css-1dbjc4n.r-1pz39u2.r-16y2uox.r-1wbh5a2"

function remove() {
  const element = document.querySelector(selector)
  if (element) {
    element.remove()
    document.documentElement.style = ""
    console.log("😎 removed!")
  }
}

setInterval(() => {
  remove()
}, 1000)
