const curry = (fn, toStringMessage) => {
  const curried = (...args) => {
    if (args.length >= fn.length) {
      return fn(...args);
    }
    const nextFn = (...argsNext) => curried(...args, ...argsNext);

    if (toStringMessage) {
      nextFn.toString = function toString() { return toStringMessage; };
    }

    return nextFn;
  };
  if (toStringMessage) {
    curried.toString = function toString() { return toStringMessage; };
  }
  return curried;
};
const compose = (...fns) => fns.reduce((f, g) => (...args) => f(g(...args)));
const TAU = Math.PI * 2;

const TRANSPARENT = [0,0,0,0];

function microcan(canvasCtx, [w, h]) {
  let width = w;
  let height = h;
  let ctx = canvasCtx;

  const stack = [];
  let textSize = 14;
  let strokeColor = [0,0,0,1];
  let fillColor = [0,0,0,1];
  let dashVector = [];

  ctx.canvas.width = w;
  ctx.canvas.height = h;

  function push() {
    stack.push({
      textSize,
      strokeColor,
      fillColor,
      dashVector,
      strokeWeight: ctx.lineWidth
    });
  }

  function pop() {
    const out = stack.pop();
    if (!out) {
      throw new Error('No stack to pop');
    }

    textSize = out.textSize;
    strokeColor = out.strokeColor;
    fillColor = out.fillColor;
    dashVector = out.dashVector;
    ctx.lineWidth = out.strokeWeight;
  }

  // State functions
  function setWidthHeight([w, h]) {
    width = w;
    height = h;
    ctx.canvas.width = w;
    ctx.canvas.height = h;
  }

  function setCtx(canvasCtx) {
    ctx = canvasCtx;
  }


  function text(text, pos) {
    ctx.fillText(text, ...pos);
    ctx.strokeText(text, ...pos);
  }

  function centeredText(text, pos) {
    const size = ctx.measureText(text);
    ctx.fillText(text, pos[0] - size.width / 2, pos[1] + textSize / 4);
    ctx.strokeText(text, pos[0] - size.width / 2, pos[1] + textSize / 4);
  }

  function setFont(size, font, modifier) {
    ctx.font = `${modifier ? modifier + ' ' : ''}${size}px ${font}`;
    textSize = size;
  }

  // Drawing modifier functions
  function fill([r, g, b, a]) {
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    fillColor = [r, g, b, a];
  }

  function stroke([r, g, b, a]) {
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    strokeColor = [r, g, b, a];
  }

  function noStroke() {
    stroke(TRANSPARENT);
    strokeColor = TRANSPARENT;
  }

  function noFill() {
    fill(TRANSPARENT);
    fillColor = TRANSPARENT;
  }

  function dash(widthSpacingVector) {
    ctx.setLineDash(widthSpacingVector);
    dashVector = widthSpacingVector;
  }

  function noDash() {
    ctx.setLineDash([]);
    dashVector = [];
  }

  function background([r, g, b, a]) {
    const oldColor = ctx.fillStyle;
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = oldColor;
  }

  function strokeWeight(weight) {
    ctx.lineWidth = weight;
  }

  // Shape descriptor functions
  function polygon(points) {
    return {
      type: 'polygon',
      points
    };
  };

  const poly = curry(function poly(n, radius, [x, y]) {
    const a = TAU / n;
    const points = Array.from(Array(n), (_, i) => [
      x + Math.cos(a * i) * radius,
      y + Math.sin(a * i) * radius
    ]);
    return polygon(points);
  }, 'poly(n:Number, radius:Number, position:Vector)');

  const alignedPoly = curry(function alignedPoly(n, radius, [x, y]) {
    const alignment = (n % 2 === 0)
      ? -TAU/(n*2)
      : Math.PI/(n*2);

    const a = (TAU / n) + alignment;
    const points = Array.from(Array(n), (_, i) => [
      x + Math.cos(a * i) * radius,
      y + Math.sin(a * i) * radius
    ]);
    return polygon(points);
  }, 'alignedPolygon(n:Number, radius:Number, position:Vector)');

  const rect = curry(function rect([w, h], [x, y]) {
    const w2 = w/2;
    const h2 = h/2;
    return polygon([
      [x - w2, y - h2],
      [x + w2, y - h2],
      [x + w2, y + h2],
      [x - w2, y + h2],
    ]);
  }, 'rect(dimensions:Vector, position:Vector)');

  const square = curry(function square(sideLength, position) {
    return rect([sideLength, sideLength], position);
  }, 'square(sideLength:Number, position:Vector)');

  const line = curry(function line(p1, p2) {
    return polygon([p1, p2]);
  }, 'line(v1:Vector, v2:Vector)');

  const fullEllipse = curry(function fullEllipse(rotation, radiusV, angleV, positionV) {
    return {
      type: 'ellipse',
      rotation,
      radius: radiusV,
      angle: angleV,
      position: positionV
    };
  }, 'fullEllipse(rotation:Number, radius:Vector, angle:Vector, position:Vector)');

  const ellipse = curry(function ellipse(rotation, radiusV, positionV) {
    return fullEllipse(rotation, radiusV, [0, TAU], positionV);
  }, 'ellipse(rotation:Number, radius:Vector, position:Vector)');

  const circle = curry(function circle(radius, positionV) {
    return fullEllipse(0, [radius, radius], [0, TAU], positionV);
  }, 'circle(radius:Number, position:Vector)');

  const arc = curry(function arc(radius, angleV, positionV) {
    return fullEllipse(0, [radius, radius], angleV, positionV);
  }, 'arc(radius:Number, angle:Vector, position:Vector)')

  // Drawing functions
  function drawEllipse(shape) {
    const {rotation, radius, angle, position} = shape;
    ctx.beginPath();
    ctx.ellipse(...position, ...radius, rotation, ...angle, false);
    ctx.stroke();
    ctx.fill();
    ctx.closePath();
  };

  function drawArc(shape) {
    const {radius, angle, position} = shape;
    ctx.beginPath();
    ctx.arc(...position, radius[0], ...angle, false);
    ctx.stroke();
    ctx.fill();
    ctx.closePath();
  }

  function drawPolygon(shape) {
    const {points} = shape;
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(...points[i]);
    }
    ctx.lineTo(...points[0]);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
  };

  function drawLine(shape) {
    const {points: [[x1, y1], [x2, y2]]} = shape;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.closePath();
  }

  function drawShape(shape) {
    switch (shape.type) {
      case 'ellipse': return drawEllipse(shape);
      case 'polygon': return drawPolygon(shape);
    }
  }

  // Maps
  const mapPolygon = curry(function liftPolygon(fn, polygonShape) {
    return polygon(polygonShape.points.map(fn));
  }, 'mapPolygon(fn:Function, polygon:Polygon)');

  const mapPosition = curry(function mapPosition(fn, e) {
    const {radius, angle, rotation} = e;
    return fullEllipse(rotation, radius, angle, fn(e));
  }, 'mapPosition(fn:Function, ellipse:Ellipse)');

  const mapRotation = curry(function mapRotation(fn, e) {
    const {radius, angle, position} = e;
    return fullEllipse(fn(e), radius, angle, position);
  }, 'mapRotation(fn:Function, ellipse:Ellipse)');

  const mapAngle = curry(function mapAngle(fn, e) {
    const {radius, position, rotation} = e;
    return fullEllipse(rotation, radius, fn(e), position);
  }, 'mapAngle(fn:Function, ellipse:Ellipse)');

  const mapRadius = curry(function mapRadius(fn, e) {
    const {angle, position, rotation} = e;
    return fullEllipse(rotation, fn(e), angle, position);
  }, 'mapRadius(fn:Function, ellipse:Ellipse)');

  // Output
  return {
    setWidthHeight,
    setCtx,
    fill,
    stroke,
    noStroke,
    noFill,
    dash,
    noDash,
    background,
    strokeWeight,
    polygon,
    poly,
    alignedPoly,
    rect,
    square,
    line,
    fullEllipse,
    ellipse,
    circle,
    arc,
    drawEllipse,
    drawArc,
    drawPolygon,
    drawShape,
    drawLine,
    mapPolygon,
    mapPosition,
    mapRotation,
    mapAngle,
    mapRadius,

    text,
    centeredText,
    setFont,
    textSize,
    strokeColor,
    fillColor,
    dashVector,
    push,
    pop,
  };
}

export default microcan;
