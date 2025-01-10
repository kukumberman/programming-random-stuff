class Runtime {
  constructor() {
    this.signalValues = []
    this.runningEffect = null
    this.signalSubscribers = new Map() // key: signal id (number), value: set of effect ids (array of unique values without duplicates)
    this.effects = []
  }

  createSignal(value) {
    this.signalValues.push(value)
    const id = this.signalValues.length - 1
    this.signalSubscribers.set(id, new Set())
    return new Signal(this, id)
  }

  createEffect(fn) {
    this.effects.push(fn)
    const id = this.effects.length - 1
    this._runEffect(id)
  }

  _runEffect(id) {
    const currentEffect = this.runningEffect
    this.runningEffect = id

    const fn = this.effects[id]
    fn()

    this.runningEffect = currentEffect
  }

  _notify(signalId) {
    const subs = this.signalSubscribers.get(signalId)
    for (const effectId of subs) {
      this._runEffect(effectId)
    }
  }
}

class Signal {
  /**
   *
   * @param {Runtime} ctx
   * @param {number} id
   */
  constructor(ctx, id) {
    this.ctx = ctx
    this.id = id
  }

  get() {
    if (this.ctx.runningEffect !== null) {
      const set = this.ctx.signalSubscribers.get(this.id)
      set.add(this.ctx.runningEffect)
    }

    return this.ctx.signalValues[this.id]
  }

  set(newValue) {
    this.ctx.signalValues[this.id] = newValue
    this.ctx._notify(this.id)
  }
}

main()

function main() {
  const div = document.createElement("div")
  const p = document.createElement("p")
  const dec = document.createElement("button")
  const inc = document.createElement("button")
  const double = document.createElement("p")

  p.textContent = "not reactive yet"
  dec.textContent = "-1"
  inc.textContent = "+1"

  div.appendChild(dec)
  div.appendChild(inc)
  div.appendChild(p)
  div.appendChild(double)
  document.body.appendChild(div)

  const ctx = new Runtime()

  const count = ctx.createSignal(0)
  const doubleCount = () => count.get() * 2

  ctx.createEffect(() => {
    p.textContent = `You clicked ${count.get()} times`
  })

  ctx.createEffect(() => {
    double.textContent = `Doubled value is equal to ${doubleCount()}`
  })

  dec.addEventListener("click", () => {
    console.log("-1")
    const value = count.get()
    count.set(value - 1)
  })

  inc.addEventListener("click", () => {
    console.log("+1")
    const value = count.get()
    count.set(value + 1)
  })
}
