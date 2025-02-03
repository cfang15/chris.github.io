var VSHADER_SOURCE = `
attribute vec4 a_Position;
uniform mat4 u_ModelMatrix;
uniform mat4 u_GlobalRotateMatrix;
void main() {
  gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
}
`;

var FSHADER_SOURCE = `
precision mediump float;
uniform vec4 u_FragColor;
void main() {
  gl_FragColor = u_FragColor;
}
`;

let canvas, gl, a_Position, u_FragColor, u_ModelMatrix, u_GlobalRotateMatrix;

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

let g_globalAngle = 0;
let g_bodyScale = 1.0;

let frontLeftLeg = 0;
let frontLeftLegAni = false;

let g_frontRightLegThighAngle = 0;
let g_frontRightLegThighAnimation = false;

let g_backLeftLegThighAngle = 0;
let g_backLeftLegPawAngle = 0;
let g_backLeftLegThighAnimation = false;
let g_backLeftLegPawAnimation = false;

let g_backRightLegThighAngle = 0;
let g_backRightLegPawAngle = 0;
let g_backRightLegThighAnimation = false;
let g_backRightLegPawAnimation = false;

let g_tailAngle = 0;
let g_tailAnimation = false;

function addActionsForHTMLUI() {
  document.getElementById('frontLeftOff').onclick = function () {
    frontLeftLegAni = false;
  };
  document.getElementById('frontLeftOn').onclick = function () {
    frontLeftLegAni = true;
  };
  document.getElementById('frontRightOff').onclick = function () {
    g_frontRightLegThighAnimation = false;
  };
  document.getElementById('frontRightOn').onclick = function () {
    g_frontRightLegThighAnimation = true;
  };
  document.getElementById('backLeftOn').onclick = function () {
    g_backLeftLegThighAnimation = true;
  };
  document.getElementById('backLeftOff').onclick = function () {
    g_backLeftLegThighAnimation = false;
  };
  document.getElementById('leftPawOff').onclick = function () {
    g_backLeftLegPawAnimation = false;
  };
  document.getElementById('leftPawOn').onclick = function () {
    g_backLeftLegPawAnimation = true;
  };
  document.getElementById('backRightOff').onclick = function () {
    g_backRightLegThighAnimation = false;
  };
  document.getElementById('backRightOn').onclick = function () {
    g_backRightLegThighAnimation = true;
  };
  document.getElementById('rightPawOff').onclick = function () {
    g_backRightLegPawAnimation = false;
  };
  document.getElementById('rightPawOn').onclick = function () {
    g_backRightLegPawAnimation = true;
  };
  document.getElementById('TailOff').onclick = function () {
    g_tailAnimation = false;
  };
  document.getElementById('TailOn').onclick = function () {
    g_tailAnimation = true;
  };
  document.getElementById('frontLeftSlide').addEventListener('mousemove', function () {
    frontLeftLeg = this.value;
    renderScene();
  });
  document.getElementById('frontRightSlide').addEventListener('mousemove', function () {
    g_frontRightLegThighAngle = this.value;
    renderScene();
  });
  document.getElementById('backLeftPawSlide').addEventListener('mousemove', function () {
    g_backLeftLegPawAngle = this.value;
    renderScene();
  });
  document.getElementById('backLeftSlide').addEventListener('mousemove', function () {
    g_backLeftLegThighAngle = this.value;
    renderScene();
  });
  document.getElementById('backRightPawSlide').addEventListener('mousemove', function () {
    g_backRightLegPawAngle = this.value;
    renderScene();
  });
  document.getElementById('backRightSlide').addEventListener('mousemove', function () {
    g_backRightLegThighAngle = this.value;
    renderScene();
  });
  document.getElementById('tailSlide').addEventListener('mousemove', function () {
    g_tailAngle = this.value;
    renderScene();
  });
  document.getElementById('angleSlide').addEventListener('mousemove', function () {
    g_globalAngle = this.value;
    renderScene();
  });
}

let isMouseDown = false;
let lastMouseX = 0;

function initMouseEvents() {
  canvas.addEventListener("mousedown", function (event) {
    if (event.shiftKey) {
      g_bodyScale = 1.5;
      renderScene();
    } else {
      isMouseDown = true;
      lastMouseX = event.clientX;
    }
  });

  canvas.addEventListener("mouseup", function () {
    isMouseDown = false;
  });

  canvas.addEventListener("mouseleave", function () {
    isMouseDown = false;
  });

  canvas.addEventListener("mousemove", function (event) {
    if (!isMouseDown) return;
    const deltaX = event.clientX - lastMouseX;
    g_globalAngle += deltaX;
    lastMouseX = event.clientX;
    renderScene();
  });
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHTMLUI();
  initMouseEvents();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  renderScene();
  requestAnimationFrame(tick);
}

var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;

function tick() {
  g_seconds = performance.now() / 1000.0 - g_startTime;
  updateAnimationAngles();
  if (g_bodyScale > 1.0) {
    g_bodyScale -= 0.01;
    if (g_bodyScale < 1.0) g_bodyScale = 1.0;
  }
  renderScene();
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  let frontLeftSlider = document.getElementById('frontLeftSlide');
  let frontRightSlider = document.getElementById('frontRightSlide');
  let backLeftSlider = document.getElementById('backLeftSlide');
  let backLeftPawSlider = document.getElementById('backLeftPawSlide');
  let backRightSlider = document.getElementById('backRightSlide');
  let backRightPawSlider = document.getElementById('backRightPawSlide');
  let tailSlider = document.getElementById('tailSlide');

  let frontLeftLegThighBase = parseFloat(frontLeftSlider.value);
  let frontRightLegThighBase = parseFloat(frontRightSlider.value);
  let backLeftLegThighBase = parseFloat(backLeftSlider.value);
  let backLeftLegPawBase = parseFloat(backLeftPawSlider.value);
  let backRightLegThighBase = parseFloat(backRightSlider.value);
  let backRightLegPawBase = parseFloat(backRightPawSlider.value);
  let tailBase = parseFloat(tailSlider.value);

  if (frontLeftLegAni) {
    frontLeftLeg = frontLeftLegThighBase + 30 * Math.sin(g_seconds);
  } else {
    frontLeftLeg = frontLeftLegThighBase;
  }

  if (g_frontRightLegThighAnimation) {
    g_frontRightLegThighAngle = frontRightLegThighBase + 30 * Math.cos(g_seconds);
  } else {
    g_frontRightLegThighAngle = frontRightLegThighBase;
  }

  if (g_backLeftLegThighAnimation) {
    g_backLeftLegThighAngle = backLeftLegThighBase + 30 * Math.sin(g_seconds);
  } else {
    g_backLeftLegThighAngle = backLeftLegThighBase;
  }

  if (g_backLeftLegPawAnimation) {
    g_backLeftLegPawAngle = backLeftLegPawBase + 30 * Math.sin(3 * g_seconds);
  } else {
    g_backLeftLegPawAngle = backLeftLegPawBase;
  }

  if (g_backRightLegThighAnimation) {
    g_backRightLegThighAngle = backRightLegThighBase + 30 * Math.cos(g_seconds);
  } else {
    g_backRightLegThighAngle = backRightLegThighBase;
  }

  if (g_backRightLegPawAnimation) {
    g_backRightLegPawAngle = backRightLegPawBase + 30 * Math.cos(3 * g_seconds);
  } else {
    g_backRightLegPawAngle = backRightLegPawBase;
  }

  if (g_tailAnimation) {
    g_tailAngle = tailBase + 60 * Math.cos(g_seconds);
  } else {
    g_tailAngle = tailBase;
  }
}

var g_shapesList = [];

function renderScene() {
  var startTime = performance.now();
  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);

  var body = new Cube();
  body.color = [0.2, 0.8, 0.2, 1];
  body.matrix.translate(-0.25, -0.025, 0.0);
  body.matrix.rotate(-10, 1, 3, 3);
  body.matrix.scale(0.7 * g_bodyScale, 0.5 * g_bodyScale, 0.7 * g_bodyScale);
  body.render();

  var frontLeft = new Cube();
  frontLeft.color = [0.2, 0.8, 0.2, 1];
  frontLeft.matrix.setTranslate(-0.12, 0, 0.0);
  frontLeft.matrix.rotate(-5, 1, 0, 0);
  frontLeft.matrix.rotate(-frontLeftLeg, 0, 0);
  frontLeft.matrix.scale(0.5, -0.5, 0.5);
  frontLeft.matrix.scale(0.25, 0.25, 0.25);
  frontLeft.matrix.translate(-0.5, 0, 0);
  frontLeft.render();

  var frontRight = new Cube();
  frontRight.color = [0.2, 0.8, 0.2, 1];
  frontRight.matrix.setTranslate(-0.12, 0, 0.5);
  frontRight.matrix.rotate(-5, 1, 0, 0);
  frontRight.matrix.rotate(-g_frontRightLegThighAngle, 0, 0);
  frontRight.matrix.scale(0.5, -0.5, 0.5);
  frontRight.matrix.scale(0.25, 0.25, 0.25);
  frontRight.matrix.translate(-0.5, 0, 0);
  frontRight.render();

  var backLeft = new Cube();
  backLeft.color = [0.2, 0.8, 0.2, 1];
  backLeft.matrix.setTranslate(0.25, 0, 0.0);
  backLeft.matrix.rotate(-5, 1, 0, 0);
  backLeft.matrix.rotate(-g_backLeftLegThighAngle, 0, 0);
  backLeft.matrix.scale(0.5, -0.5, 0.5);
  var backLeftLegThighCoordinatesMat = new Matrix4(backLeft.matrix);
  backLeft.matrix.scale(0.25, 0.75, 0.25);
  backLeft.matrix.translate(-0.5, 0, 0);
  backLeft.render();

  var backLeftPaw = new Cube();
  backLeftPaw.color = [0.5, 0.25, 0.1, 1];
  backLeftPaw.matrix = backLeftLegThighCoordinatesMat;
  backLeftPaw.matrix.translate(0, 0.65, 0);
  backLeftPaw.matrix.rotate(-g_backLeftLegPawAngle, 0, 0, 1);
  backLeftPaw.matrix.scale(0.20, 0.25, 0.20);
  backLeftPaw.matrix.translate(-0.5, 0.45, -0.001);
  backLeftPaw.render();

  var backRight = new Cube();
  backRight.color = [0.2, 0.8, 0.2, 1];
  backRight.matrix.setTranslate(0.25, 0, 0.5);
  backRight.matrix.rotate(-5, 1, 0, 0);
  backRight.matrix.rotate(-g_backRightLegThighAngle, 0, 0);
  backRight.matrix.scale(0.5, -0.5, 0.5);
  var backRightLegThighCoordinatesMat = new Matrix4(backRight.matrix);
  backRight.matrix.scale(0.25, 0.75, 0.25);
  backRight.matrix.translate(-0.5, 0, 0);
  backRight.render();

  var backRightPaw = new Cube();
  backRightPaw.color = [0.5, 0.25, 0.1, 1];
  backRightPaw.matrix = backRightLegThighCoordinatesMat;
  backRightPaw.matrix.translate(0, 0.65, 0);
  backRightPaw.matrix.rotate(-g_backRightLegPawAngle, 0, 0, 1);
  backRightPaw.matrix.scale(0.20, 0.25, 0.20);
  backRightPaw.matrix.translate(-0.5, 0.45, -0.001);
  backRightPaw.render();

  var head = new Cone();
  head.color = [0.2, 0.8, 0.2, 1];
  head.matrix.translate(-0.5, 0.5, 0.15);
  head.matrix.scale(0.25, 0.25, 0.25);
  head.matrix.rotate(-100, 2, 0, 0);
  head.render();

  var tail = new Cube();
  tail.color = [0.2, 0.8, 0.2, 1];
  tail.matrix.translate(0.45, 0.5, 0.35);
  tail.matrix.rotate(-0.75, 1, -1, 0);
  tail.matrix.rotate(-g_tailAngle, 0, 0);
  tail.matrix.scale(0.2, 0.5, 0.2);
  tail.render();

  var duration = performance.now() - startTime;
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000 / duration), "numdot");
}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get: " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}
