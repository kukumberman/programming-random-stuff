const radius = 10
const lineSize = 5
const segments = []

const SPACE_KEY = 32

let isDragging = false
let selectedPoint = null

let addingState = 0

class Point {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.isActive = false
  }
}

class Segment {
  constructor(a, b) {
    this.a = a
    this.b = b
  }
  
  drawSelf(lineWeight, pointWeight) {
    stroke("white")
    strokeWeight(lineWeight)
    line(this.a.x, this.a.y, this.b.x, this.b.y)
    
    strokeWeight(pointWeight)
    
    stroke(this.a.isActive ? "green" : "white")
    point(this.a.x, this.a.y)
    
    stroke(this.b.isActive ? "green" : "white")
    point(this.b.x, this.b.y)
  }
  
  validateMouse(mousePosition) {
    this.a.isActive = dist(this.a.x, this.a.y, mousePosition.x, mousePosition.y) < radius
    this.b.isActive = dist(this.b.x, this.b.y, mousePosition.x, mousePosition.y) < radius
  }
  
  resetPoints() {
    this.a.isActive = this.b.isActive = false
  }
}

function setup() {
  createCanvas(800, 600)
  background(0)
  
  segments.push(new Segment(new Point(100, 100), new Point(300, 100)))
  segments.push(new Segment(new Point(100, 200), new Point(300, 200)))
}

function draw() {
  clear()
  background("black")
  
  if (isDragging) {
    selectedPoint.x = mouseX
    selectedPoint.y = mouseY
  }
  
  if (addingState === 1) {
    const lastSegment = segments[segments.length - 1]
    lastSegment.b.x = mouseX
    lastSegment.b.y = mouseY
  }
  
  for (const segment of segments) {
    segment.drawSelf(lineSize, radius)
  }
  
  if (segments.length > 1) {
    for (let i = 0; i < segments.length; i++) {
      for (let j = 1; j < segments.length; j++) {
        const [success, intersectionPoint] = lineSegmentIntersection(segments[i], segments[j])
        
        if (success) {
          stroke("red")
          point(intersectionPoint.x, intersectionPoint.y)
        }
      }
    }
  }
}

function mousePressed() {
  const mousePosition = createVector(mouseX, mouseY)
  
  for (const segment of segments) {
    segment.validateMouse(mousePosition)
    
    if (segment.a.isActive) {
      isDragging = true
      selectedPoint = segment.a
      break
    }
    else if (segment.b.isActive) {
      isDragging = true
      selectedPoint = segment.b
      break
    }
  }
}

function mouseReleased() {
  isDragging = false
  selectedPoint = null
  
  for (const segment of segments) {
    segment.resetPoints()
  }
}

function keyPressed() {
  if (isDragging) {
    return
  }
  
  if (keyCode === SPACE_KEY) {
    if (addingState === 0) {
      const a = new Point(mouseX, mouseY)
      const b = new Point(mouseX, mouseY)
      
      const segment = new Segment(a, b)
      
      segments.push(segment)
      
      addingState = 1
    }
    else if (addingState === 1) {
      addingState = 0
    }
  }
  else if (keyCode == ESCAPE) {
    if (addingState === 1) {
      segments.pop()
      
      addingState = 0
    }
  }
}

function lineSegmentIntersection(segmentOne, segmentTwo) {
  const intersectionPoint = createVector(0, 0)
  
  const [p1, p2] = [segmentOne.a, segmentOne.b]
  const [p3, p4] = [segmentTwo.a, segmentTwo.b]
  
  const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x)
  
  if (d == 0) return [false, intersectionPoint]
  
  const u = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d
  const v = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d
  
  if (u < 0 || u > 1 || v < 0 || v > 1) {
    return [false, intersectionPoint]
  }
  
  intersectionPoint.x = p1.x + u * (p2.x - p1.x)
  intersectionPoint.y = p1.y + u * (p2.y - p1.y)
  
  return [true, intersectionPoint]
}
