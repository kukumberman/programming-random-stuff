(function() {
  const elements = Array.from(document.querySelectorAll("table#DataTables_Table_0 > tbody > tr"))
  const items = elements.map(el => {
    return {
      name: el.children[0].textContent,
      sha1: el.children[1].textContent,
      size: +el.children[2].textContent,
    }
  })
  const json = JSON.stringify(items, null, 2)
  console.log(items)
  // console.log(json)

  const btn = document.createElement("button")
  btn.textContent = "Write to clipboard"
  btn.addEventListener("click", () => {
    writeClipboardText(json)
  })

  document.querySelector(".header-navbar").appendChild(btn)

  async function writeClipboardText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error(error.message);
    }
  }

})()
