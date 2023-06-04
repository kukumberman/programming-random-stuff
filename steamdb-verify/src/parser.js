;(function () {
  const elements = Array.from(document.querySelectorAll("#DataTables_Table_2 > tbody > tr"))
  const entries = elements
    .map((element) => {
      return {
        name: element.children[0].textContent,
        sha1: element.children[1].textContent,
      }
    })
    .filter((entry) => entry.sha1 !== "NULL")
  const result = JSON.stringify(entries, null, 2)
  console.log(result)
})()
