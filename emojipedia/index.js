;(function () {
  /**
   *
   * @param {string} url
   * @returns
   */
  function urlToId(url) {
    const parts = url.split("/")
    const filename = parts[parts.length - 1]
    const id = filename.split(".")[0]
    return id
  }

  // ! https://emojipedia.org/google

  const categoryElements = Array.from(
    document.querySelectorAll("section.Section_section__RsAPV > div > div.mb-4")
  )

  const data = categoryElements.map((categoryElement) => {
    return {
      title: categoryElement.querySelector("h2").textContent,
      emojis: Array.from(categoryElement.querySelectorAll("div > a")).map((a) =>
        urlToId(a.getAttribute("data-src"))
      ),
    }
  })

  console.log(JSON.stringify(data))

  const total = data.reduce((acc, item) => acc + item.emojis.length, 0)
  console.log(total)
  console.log(data)
})()
