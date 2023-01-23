import { extractTime, prettyTime } from "./utils"

interface ICard {
  title: string
  memberNames: Array<string>
  time: number
}

interface IColumn {
  name: string
  cards: Array<ICard>
  getTotalTime(): number
  getTotalTimePretty(): string
}

export default class Trello {
  public columnsByName: Map<string, IColumn>

  constructor(private root: Element) {
    this.columnsByName = this.getAllColumns().reduce((acc, item) => {
      acc.set(item.name, item)
      return acc
    }, new Map<string, IColumn>())
  }

  private parseCard(element: Element): ICard {
    const title = element.querySelector("span.list-card-title")!.textContent!
    const memberNames = Array.from(element.querySelectorAll("img.member-avatar")).map(
      (image) => image.getAttribute("title")!
    )
    return {
      title,
      memberNames,
      time: extractTime(title),
    }
  }

  private parseColumn(element: Element): IColumn {
    const name = element.querySelector("h2")!.textContent!
    const cards = Array.from(element.querySelectorAll("a.list-card")).map((cardElement) =>
      this.parseCard(cardElement)
    )
    return {
      name,
      cards,
      getTotalTime() {
        return this.cards.map((card) => card.time).reduce((acc, item) => acc + item, 0)
      },
      getTotalTimePretty() {
        return prettyTime(this.getTotalTime())
      },
    }
  }

  getAllColumns() {
    return Array.from(this.root.querySelectorAll("#board > .js-list.list-wrapper")).map(
      (columnElement) => this.parseColumn(columnElement)
    )
  }

  getColumn(columnName: string): IColumn | undefined {
    return this.getAllColumns().find((column) => column.name === columnName)
  }
}
