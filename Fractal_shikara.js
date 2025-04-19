let scaleFactorSlider, ellipseCountSlider, levelsSlider;
let ridgeCountSlider, ridgeSharpnessSlider;
let globalCutoffY = -1000;
let objData = "";
let downloadButton;

function setup() {
  createCanvas(800, 800, WEBGL);
  document.oncontextmenu = () => false;

  createP("Scale Factor").position(10, height + 10);
  scaleFactorSlider = createSlider(0.4, 0.95, 0.7, 0.01).position(150, height + 10);

  createP("Ellipses per Level").position(10, height + 40);
  ellipseCountSlider = createSlider(3, 12, 6, 1).position(150, height + 40);

  createP("Fractal Levels").position(10, height + 70);
  levelsSlider = createSlider(1, 6, 3, 1).position(150, height + 70);

  createP("Ridge Count").position(10, height + 100);
  ridgeCountSlider = createSlider(3, 24, 12, 1).position(150, height + 100);

  createP("Ridge Sharpness").position(10, height + 130);
  ridgeSharpnessSlider = createSlider(0.05, 0.5, 0.15, 0.01).position(150, height + 130);

  downloadButton = createButton("Download OBJ");
  downloadButton.position(10, height + 170);
  downloadButton.mousePressed(downloadOBJ);
}

function draw() {
  background(245);
  orbitControl();
  directionalLight(255, 255, 255, -0.5, -1, -1);
  ambientLight(120);
  rotateX(PI);
  rotateZ(PI);

  let baseRadius = 60;
  let scaleFactor = scaleFactorSlider.value();
  let ellipseCount = ellipseCountSlider.value();
  let levels = levelsSlider.value();
  let ridgeCount = ridgeCountSlider.value();
  let ridgeSharpness = ridgeSharpnessSlider.value();

  let nextRadius = baseRadius * scaleFactor;
  let nextHeight = nextRadius * 4;
  globalCutoffY = -nextHeight / 2;

  drawFractalShikhara3D(
    0, 0, 0,
    baseRadius, levels,
    scaleFactor, ellipseCount,
    ridgeCount, ridgeSharpness
  );
}

function drawFractalShikhara3D(x, y, z, radius, level, scaleFactor, ellipseCount, ridgeCount, ridgeSharpness) {
  if (level <= 0) return;

  let height = radius * 4;
  let yBottom = y - height / 2;
  let yTop = y + height / 2;

  if (yTop > globalCutoffY) {
    push();
    translate(x, y - height / 2, z);
    specularMaterial(200);
    noStroke();
    drawClippedEllipsoid(radius, height, radius, ridgeCount, ridgeSharpness, globalCutoffY - yBottom);
    pop();
  }

  let newRadius = radius * scaleFactor;
  let newHeight = newRadius * 4;
  let angleStep = 360 / ellipseCount;
  let r = radius + newRadius * 0.9;

  for (let a = 0; a < 360; a += angleStep) {
    let cx = x + r * cos(a);
    let cz = z + r * sin(a);
    let cy = y;
    drawFractalShikhara3D(
      cx, cy, cz,
      newRadius, level - 1,
      scaleFactor, ellipseCount,
      ridgeCount, ridgeSharpness
    );
  }
}

function drawClippedEllipsoid(rx, ry, rz, ridges, sharpness, trimHeight) {
  let detailY = 20;
  let detailX = 20;

  for (let i = 0; i < detailY; i++) {
    let theta1 = map(i, 0, detailY, -HALF_PI, HALF_PI);
    let theta2 = map(i + 1, 0, detailY, -HALF_PI, HALF_PI);

    beginShape(TRIANGLE_STRIP);
    for (let j = 0; j <= detailX; j++) {
      let phi = map(j, 0, detailX, 0, TWO_PI);
      let starMod = 1 + sharpness * sin(phi * ridges);

      let x1 = rx * starMod * cos(theta1) * cos(phi);
      let y1 = ry * sin(theta1);
      let z1 = rz * starMod * cos(theta1) * sin(phi);

      let x2 = rx * starMod * cos(theta2) * cos(phi);
      let y2 = ry * sin(theta2);
      let z2 = rz * starMod * cos(theta2) * sin(phi);

      if (y1 >= trimHeight && y2 >= trimHeight) {
        vertex(x1, y1, z1);
        vertex(x2, y2, z2);
      }
    }
    endShape();
  }
}

// OBJ EXPORT
function downloadOBJ() {
  objData = "";
  let baseRadius = 60;
  let scaleFactor = scaleFactorSlider.value();
  let ellipseCount = ellipseCountSlider.value();
  let levels = levelsSlider.value();
  let ridgeCount = ridgeCountSlider.value();
  let ridgeSharpness = ridgeSharpnessSlider.value();

  let nextRadius = baseRadius * scaleFactor;
  let nextHeight = nextRadius * 4;
  globalCutoffY = -nextHeight / 2;

  let vertexOffset = { count: 0 };
  recordFractalOBJ(0, 0, 0, baseRadius, levels, scaleFactor, ellipseCount, ridgeCount, ridgeSharpness, vertexOffset);
  saveStrings([objData], "shikhara.obj");
}

function recordFractalOBJ(x, y, z, radius, level, scaleFactor, ellipseCount, ridgeCount, ridgeSharpness, offset) {
  if (level <= 0) return;

  let height = radius * 4;
  let yBottom = y - height / 2;
  let yTop = y + height / 2;

  if (yTop > globalCutoffY) {
    recordClippedEllipsoidOBJ(x, y - height / 2, z, radius, height, radius, ridgeCount, ridgeSharpness, globalCutoffY - yBottom, offset);
  }

  let newRadius = radius * scaleFactor;
  let angleStep = 360 / ellipseCount;
  let r = radius + newRadius * 0.9;

  for (let a = 0; a < 360; a += angleStep) {
    let cx = x + r * cos(a);
    let cz = z + r * sin(a);
    let cy = y;
    recordFractalOBJ(cx, cy, cz, newRadius, level - 1, scaleFactor, ellipseCount, ridgeCount, ridgeSharpness, offset);
  }
}

function recordClippedEllipsoidOBJ(px, py, pz, rx, ry, rz, ridges, sharpness, trimHeight, offset) {
  let detailY = 20;
  let detailX = 20;
  let vertices = [];

  for (let i = 0; i <= detailY; i++) {
    let theta = map(i, 0, detailY, -HALF_PI, HALF_PI);
    let ring = [];
    for (let j = 0; j <= detailX; j++) {
      let phi = map(j, 0, detailX, 0, TWO_PI);
      let starMod = 1 + sharpness * sin(phi * ridges);
      let x = px + rx * starMod * cos(theta) * cos(phi);
      let y = py + ry * sin(theta);
      let z = pz + rz * starMod * cos(theta) * sin(phi);
      if (y >= globalCutoffY) {
        objData += `v ${x} ${y} ${z}\n`;
        ring.push(offset.count++);
      } else {
        ring.push(null);
      }
    }
    vertices.push(ring);
  }

  for (let i = 0; i < detailY; i++) {
    for (let j = 0; j < detailX; j++) {
      let a = vertices[i][j];
      let b = vertices[i + 1][j];
      let c = vertices[i + 1][j + 1];
      let d = vertices[i][j + 1];
      if (a !== null && b !== null && d !== null) objData += `f ${a + 1} ${b + 1} ${d + 1}\n`;
      if (b !== null && c !== null && d !== null) objData += `f ${b + 1} ${c + 1} ${d + 1}\n`;
    }
  }
}
