// Cone.js
function Cone() {
    // Default color (you can change this later)
    this.color = [0.2, 0.8, 0.2, 1];
    // Model transformation matrix (provided by your Matrix4 library)
    this.matrix = new Matrix4();
    // Build the cone's vertex data and buffers
    this.initVertexBuffers();
  }
  
  Cone.prototype.initVertexBuffers = function() {
    // Number of segments to approximate the circle:
    var segments = 30;
    // Define y-levels for the apex and the base.
    var apexY = 1.0;    // Apex at y = 1
    var baseY = -1.0;   // Base circle at y = -1
    var baseRadius = 1.0;
  
    var vertices = [];
    var indices = [];
    
    // --- Lateral (side) surface ---
    // 1. Add the apex vertex.
    //    This will be the first vertex (index 0).
    vertices.push(0.0, apexY, 0.0);
  
    // 2. Add vertices around the base circle.
    //    We add (segments+1) vertices so that the circle is "closed" (the last vertex equals the first).
    var angleStep = 2 * Math.PI / segments;
    for (var i = 0; i <= segments; i++) {
      var angle = i * angleStep;
      var x = baseRadius * Math.cos(angle);
      var z = baseRadius * Math.sin(angle);
      vertices.push(x, baseY, z);
    }
    // At this point, the lateral surface uses:
    //    - vertex 0: apex
    //    - vertices 1 to segments+1: the circle at the base (with vertex segments+1 duplicating vertex 1)
  
    // --- Base (bottom) surface ---
    // 3. Add the center of the base.
    //    Its index will be (current number of vertices)/3.
    var baseCenterIndex = vertices.length / 3;
    vertices.push(0.0, baseY, 0.0);
  
    // 4. Add the base circle vertices for the triangle fan.
    //    To ensure the base is drawn with the proper winding (so its front faces are visible),
    //    we add these vertices in reverse order.
    var baseCircleStartIndex = vertices.length / 3;
    for (var i = segments; i >= 0; i--) {
      var angle = i * angleStep;
      var x = baseRadius * Math.cos(angle);
      var z = baseRadius * Math.sin(angle);
      vertices.push(x, baseY, z);
    }
  
    // --- Create indices for the lateral (side) surface ---
    var lateralIndices = [];
    // For each slice, build one triangle with:
    //    - the apex (index 0)
    //    - a vertex on the base circle (index i)
    //    - the next vertex on the base circle (index i+1)
    for (var i = 1; i <= segments; i++) {
      lateralIndices.push(0, i, i + 1);
    }
  
    // --- Create indices for the base (bottom) surface ---
    var baseIndices = [];
    // The triangle fan starts with the center vertex,
    // followed by all the base circle vertices we just added.
    baseIndices.push(baseCenterIndex);
    // There are (segments+1) vertices in the base circle (including the duplicate at the end).
    var numBaseCircleVertices = segments + 1;
    for (var i = 0; i < numBaseCircleVertices; i++) {
      baseIndices.push(baseCircleStartIndex + i);
    }
  
    // Combine the indices into one array.
    // (Later, we will draw the first part using TRIANGLES and then the second part using TRIANGLE_FAN.)
    indices = lateralIndices.concat(baseIndices);
  
    // --- Create and set up the vertex buffer ---
    this.vertexBuffer = gl.createBuffer();
    if (!this.vertexBuffer) {
      console.log('Failed to create the vertex buffer object for Cone');
      return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  
    // --- Create and set up the index buffer ---
    this.indexBuffer = gl.createBuffer();
    if (!this.indexBuffer) {
      console.log('Failed to create the index buffer object for Cone');
      return;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  
    // Save counts for the two parts.
    this.lateralIndexCount = lateralIndices.length;
    this.baseIndexCount = baseIndices.length;
  };
  
  Cone.prototype.render = function() {
    // Set the uniform color for the fragment shader
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    // Pass the model matrix to the shader
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  
    // --- Bind the vertex buffer and configure the attribute ---
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    // Assume that the attribute location for a_Position is stored in the global variable 'a_Position'
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
  
    // --- Bind the index buffer ---
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
  
    // --- Draw the lateral (side) surface using triangles ---
    // No offset needed; start at byte offset 0.
    gl.drawElements(gl.TRIANGLES, this.lateralIndexCount, gl.UNSIGNED_SHORT, 0);
  
    // --- Draw the base (bottom) surface using a triangle fan ---
    // Compute the byte offset where the base indices begin.
    // (Each index is a 16-bit (2-byte) value.)
    var offsetInBytes = this.lateralIndexCount * 2;
    gl.drawElements(gl.TRIANGLE_FAN, this.baseIndexCount, gl.UNSIGNED_SHORT, offsetInBytes);
  };
  