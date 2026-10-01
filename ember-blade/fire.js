/* Copyright 2026 aidevksh. SPDX-License-Identifier: Apache-2.0 */
// Small transparent WebGL layer: the still image supplies steel; this supplies live fire.
window.createBladeFire = () => {
  const surface = document.createElement('canvas');
  surface.width = 960; surface.height = 540;
  const gl = surface.getContext('webgl', { alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: false });
  if (!gl) return null;
  const vertex = 'attribute vec2 position; void main(){gl_Position=vec4(position,0.,1.);}';
  // Sampled edge landmarks in the 1600×900 scene; the photographed blade tapers gently.
  const upperEdge = [[107,798],[144,756],[239,665],[335,585],[431,516],[526,452],[622,394],[718,339],[813,285],[909,233],[1005,182],[1101,131],[1196,80],[1292,29],[1388,-25],[1483,-80],[1600,-148]];
  const lowerEdge = [[107,798],[144,786],[239,753],[335,716],[431,677],[526,633],[622,586],[718,536],[813,486],[909,433],[1005,380],[1101,326],[1196,272],[1292,215],[1388,158],[1483,99],[1600,32]];
  function edgeFunction(name, points) {
    let source = `float ${name}(float x){float y=${points[0][1].toFixed(1)};`;
    for (let i = 1; i < points.length; i++) {
      const [x, y] = points[i - 1], [nx, ny] = points[i];
      source += `y+=${(ny-y).toFixed(1)}*clamp((x-${x.toFixed(1)})/${(nx-x).toFixed(1)},0.,1.);`;
    }
    return source + 'return y;}';
  }
  const fragment = `
    precision highp float;
    uniform float time;
    ${edgeFunction('upperEdge', upperEdge)}
    ${edgeFunction('lowerEdge', lowerEdge)}
    float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
    float noise(vec2 p) {
      vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);
    }
    float fbm(vec2 p) {
      float result=0., amp=.5;
      for(int i=0;i<5;i++){result+=amp*noise(p);p=mat2(.8,-.6,.6,.8)*p*2.03+vec2(17.1,9.2);amp*=.5;}
      return result;
    }
    vec2 fire(vec2 p,float edge,float outward,float strength) {
      float h=(p.y-edge)*outward;
      float taper=smoothstep(108.,265.,p.x);
      float height=(65.+44.*noise(vec2(p.x*.007,time*.35)))*taper;
      float y=h/max(1.,height);
      vec2 uv=vec2(p.x*.017,p.y*.024+time*1.55);
      float curl=fbm(uv*.48+vec2(time*.13,-time*.36));
      float detail=fbm(uv+vec2(curl*3.,-time*.9));
      float density=1.-y-detail*.95+sin(p.x*.028+curl*7.)*.17;
      float body=smoothstep(.05,.47,density)*smoothstep(-3.,6.,h)*(1.-smoothstep(.8,1.9,y));
      float core=exp(-max(h,0.)*.10)*smoothstep(-2.,2.,h)*(.8+noise(uv*2.)*.2);
      float amount=max(body,core)*strength*smoothstep(108.,140.,p.x);
      float heat=clamp(density*.7+core*.65,0.,1.);
      return vec2(amount,heat);
    }
    void main() {
      vec2 p=vec2(gl_FragCoord.x/960.*1600.,(1.-gl_FragCoord.y/540.)*900.);
      float upper=upperEdge(p.x);
      float lower=lowerEdge(p.x);
      vec2 a=fire(p,upper,-1.,1.);
      vec2 b=fire(p,lower,1.,.72);
      float alpha=max(a.x,b.x);
      float heat=max(a.y*a.x,b.y*b.x)/max(alpha,.001);
      vec3 color=mix(vec3(.72,.035,.003),vec3(1.,.30,.012),smoothstep(.05,.55,heat));
      color=mix(color,vec3(1.,.87,.36),pow(heat,4.));
      gl_FragColor=vec4(color,alpha*.94);
    }`;
  function shader(type, source) {
    const result = gl.createShader(type); gl.shaderSource(result, source); gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(result));
    return result;
  }
  const program = gl.createProgram();
  gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex)); gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment)); gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position'); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const clock = gl.getUniformLocation(program, 'time'); gl.viewport(0, 0, surface.width, surface.height);
  let lost = false;
  surface.addEventListener('webglcontextlost', event => { event.preventDefault(); lost = true; });
  // Rebuild through the caller after restoration instead of reusing invalid GPU resources.
  surface.addEventListener('webglcontextrestored', () => surface.dispatchEvent(new Event('fire-restored')));
  return { surface, render(t) { if (lost) return false; gl.uniform1f(clock, t); gl.drawArrays(gl.TRIANGLES, 0, 6); return true; } };
};
