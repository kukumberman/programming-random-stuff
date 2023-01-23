import Trello from "./trello"

Object.defineProperty(window, "myTrello", {
  configurable: true,
  value: new Trello(document.body),
})
