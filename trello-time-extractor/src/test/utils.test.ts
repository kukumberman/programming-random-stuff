import { extractTime, prettyTime } from "../utils"

describe("extractTime", () => {
  test("*", () => {
    expect(extractTime("[5h 30m]")).toEqual(5 * 60 + 30)
    expect(extractTime("[12h 2m]")).toEqual(12 * 60 + 2)
    expect(extractTime("[33h 44m]")).toEqual(33 * 60 + 44)
    expect(extractTime("[2h]")).toEqual(2 * 60)
    expect(extractTime("[5m]")).toEqual(5)
    expect(extractTime("[11h]")).toEqual(11 * 60)
    expect(extractTime("[50m]")).toEqual(50)
    expect(extractTime("#46[5h] Name")).toEqual(5 * 60)
  })
})

describe("prettyTime", () => {
  test("*", () => {
    expect(prettyTime(0)).toEqual("0m")
    expect(prettyTime(23)).toEqual("23m")
    expect(prettyTime(60)).toEqual("1h")
    expect(prettyTime(61)).toEqual("1h 1m")
    expect(prettyTime(123)).toEqual("2h 3m")
  })
})
