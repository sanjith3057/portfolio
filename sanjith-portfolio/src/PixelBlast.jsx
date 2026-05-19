import { useEffect, useRef } from 'react';
import './PixelBlast.css';

/* ── vertex shader ──────────────────────────────────────────── */
const VERT = `#version 300 es
void main() {
  // draw a full-screen triangle from gl_VertexID
  vec2 pos[3];
  pos[0] = vec2(-1.0, -1.0);
  pos[1] = vec2( 3.0, -1.0);
  pos[2] = vec2(-1.0,  3.0);
  gl_Position = vec4(pos[gl_VertexID], 0.0, 1.0);
}`;

/* ── fragment shader ─────────────────────────────────────────── */
const FRAG = `#version 300 es
precision highp float;

uniform vec3  uColor;
uniform vec2  uResolution;
uniform float uTime;
uniform float uPixelSize;
uniform float uScale;
uniform float uDensity;
uniform float uPixelJitter;
uniform int   uEnableRipples;
uniform float uRippleSpeed;
uniform float uRippleThickness;
uniform float uRippleIntensity;
uniform float uEdgeFade;
uniform int   uShapeType;

const int MAX_CLICKS = 10;
uniform vec2  uClickPos[MAX_CLICKS];
uniform float uClickTimes[MAX_CLICKS];

out vec4 fragColor;

float Bayer2(vec2 a){
  a=floor(a);
  return fract(a.x/2.+a.y*a.y*.75);
}
float Bayer4(vec2 a){ return Bayer2(.5*a)*.25+Bayer2(a); }
float Bayer8(vec2 a){ return Bayer4(.5*a)*.25+Bayer2(a); }

float hash11(float n){ return fract(sin(n)*43758.5453); }

float vnoise(vec3 p){
  vec3 ip=floor(p), fp=fract(p);
  float n000=hash11(dot(ip+vec3(0,0,0),vec3(1,57,113)));
  float n100=hash11(dot(ip+vec3(1,0,0),vec3(1,57,113)));
  float n010=hash11(dot(ip+vec3(0,1,0),vec3(1,57,113)));
  float n110=hash11(dot(ip+vec3(1,1,0),vec3(1,57,113)));
  float n001=hash11(dot(ip+vec3(0,0,1),vec3(1,57,113)));
  float n101=hash11(dot(ip+vec3(1,0,1),vec3(1,57,113)));
  float n011=hash11(dot(ip+vec3(0,1,1),vec3(1,57,113)));
  float n111=hash11(dot(ip+vec3(1,1,1),vec3(1,57,113)));
  vec3 w=fp*fp*fp*(fp*(fp*6.-15.)+10.);
  return mix(mix(mix(n000,n100,w.x),mix(n010,n110,w.x),w.y),
             mix(mix(n001,n101,w.x),mix(n011,n111,w.x),w.y),w.z)*2.-1.;
}

float fbm2(vec2 uv, float t){
  vec3 p=vec3(uv*uScale,t);
  float s=1.0,amp=1.0,freq=1.0;
  for(int i=0;i<5;i++){ s+=amp*vnoise(p*freq); freq*=1.25; amp*=1.0; }
  return s*0.5+0.5;
}

float maskCircle(vec2 p,float cov){
  float r=sqrt(cov)*.25;
  float d=length(p-0.5)-r;
  float aa=0.5*fwidth(d);
  return cov*(1.-smoothstep(-aa,aa,d*2.));
}
float maskDiamond(vec2 p,float cov){
  float r=sqrt(cov)*0.564;
  return step(abs(p.x-0.49)+abs(p.y-0.49),r);
}
float maskTriangle(vec2 p,vec2 id,float cov){
  bool flip=mod(id.x+id.y,2.)>0.5;
  if(flip) p.x=1.-p.x;
  float r=sqrt(cov);
  float d=p.y-r*(1.-p.x);
  float aa=fwidth(d);
  return cov*clamp(0.5-d/aa,0.,1.);
}

void main(){
  vec2 fragCoord = gl_FragCoord.xy - uResolution*.5;
  float ar = uResolution.x/uResolution.y;

  vec2 pixelId  = floor(fragCoord/uPixelSize);
  vec2 pixelUV  = fract(fragCoord/uPixelSize);
  float cell    = 8.*uPixelSize;
  vec2 uv       = floor(fragCoord/cell)*cell/uResolution*vec2(ar,1.);

  float base = fbm2(uv, uTime*0.05)*0.5 - 0.65;
  float feed = base + (uDensity-0.5)*0.3;

  if(uEnableRipples==1){
    for(int i=0;i<MAX_CLICKS;i++){
      vec2 pos=uClickPos[i];
      if(pos.x<0.) continue;
      vec2 cuv=((pos-uResolution*.5-cell*.5)/uResolution)*vec2(ar,1.);
      float t=max(uTime-uClickTimes[i],0.);
      float r=distance(uv,cuv);
      float ring=exp(-pow((r-uRippleSpeed*t)/uRippleThickness,2.));
      float att=exp(-t)*exp(-10.*r);
      feed=max(feed,ring*att*uRippleIntensity);
    }
  }

  float bayer=Bayer8(fragCoord/uPixelSize)-0.5;
  float bw=step(0.5,feed+bayer);
  float h=fract(sin(dot(pixelId,vec2(127.1,311.7)))*43758.5453);
  float cov=bw*(1.+(h-.5)*uPixelJitter);

  float M;
  if     (uShapeType==1) M=maskCircle(pixelUV,cov);
  else if(uShapeType==2) M=maskTriangle(pixelUV,pixelId,cov);
  else if(uShapeType==3) M=maskDiamond(pixelUV,cov);
  else                   M=cov;

  if(uEdgeFade>0.){
    vec2 norm=gl_FragCoord.xy/uResolution;
    float edge=min(min(norm.x,norm.y),min(1.-norm.x,1.-norm.y));
    M*=smoothstep(0.,uEdgeFade,edge);
  }

  vec3 c=uColor;
  vec3 srgb=mix(c*12.92,1.055*pow(c,vec3(1./2.4))-0.055,step(0.0031308,c));
  fragColor=vec4(srgb,M);
}`;

const SHAPE_MAP = { square:0, circle:1, triangle:2, diamond:3 };

function hexToRgb(hex){
  const r=parseInt(hex.slice(1,3),16)/255;
  const g=parseInt(hex.slice(3,5),16)/255;
  const b=parseInt(hex.slice(5,7),16)/255;
  return [r,g,b];
}

const MAX_CLICKS = 10;

const PixelBlast = ({
  variant        = 'square',
  pixelSize      = 3,
  color          = '#B497CF',
  className,
  style,
  patternScale       = 2,
  patternDensity     = 1,
  pixelSizeJitter    = 0,
  enableRipples      = true,
  rippleSpeed        = 0.3,
  rippleThickness    = 0.1,
  rippleIntensityScale = 1,
  speed          = 0.5,
  transparent    = true,
  edgeFade       = 0.5,
}) => {
  const canvasRef = useRef(null);
  const stateRef  = useRef(null);
  const propsRef  = useRef({});

  // keep latest props accessible inside the RAF loop without re-init
  propsRef.current = {
    variant, pixelSize, color, patternScale, patternDensity,
    pixelSizeJitter, enableRipples, rippleSpeed, rippleThickness,
    rippleIntensityScale, speed, transparent, edgeFade,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /* ── WebGL2 setup ── */
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!gl) { console.warn('WebGL2 not available'); return; }

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        console.error(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER,   VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
      console.error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);

    const U = name => gl.getUniformLocation(prog, name);
    const locs = {
      color:     U('uColor'),     resolution: U('uResolution'),
      time:      U('uTime'),      pixelSize:  U('uPixelSize'),
      scale:     U('uScale'),     density:    U('uDensity'),
      jitter:    U('uPixelJitter'), ripples:  U('uEnableRipples'),
      rSpeed:    U('uRippleSpeed'), rThick:   U('uRippleThickness'),
      rIntensity:U('uRippleIntensity'), edgeFade: U('uEdgeFade'),
      shape:     U('uShapeType'),
      clickPos:  Array.from({length:MAX_CLICKS},(_,i)=>U(`uClickPos[${i}]`)),
      clickTimes:Array.from({length:MAX_CLICKS},(_,i)=>U(`uClickTimes[${i}]`)),
    };

    // click ring state
    const clicks = Array.from({length:MAX_CLICKS},()=>({x:-1,y:-1,t:0}));
    let clickIdx = 0;
    let elapsed  = 0;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const w = canvas.parentElement?.clientWidth  || canvas.clientWidth  || 1;
      const h = canvas.parentElement?.clientHeight || canvas.clientHeight || 1;
      canvas.width  = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width  = w + 'px';
      canvas.style.height = h + 'px';
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement || canvas);

    const onPointerDown = e => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * dpr;
      const y = (rect.height - (e.clientY - rect.top)) * dpr;
      clicks[clickIdx] = { x, y, t: elapsed };
      clickIdx = (clickIdx + 1) % MAX_CLICKS;
    };
    canvas.addEventListener('pointerdown', onPointerDown, { passive: true });

    let raf = 0;
    let last = performance.now();

    const frame = now => {
      const dt = (now - last) / 1000;
      last = now;
      elapsed += dt * propsRef.current.speed;

      const p = propsRef.current;
      gl.clearColor(0,0,0,0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      const rgb = hexToRgb(p.color);
      gl.uniform3f(locs.color, rgb[0], rgb[1], rgb[2]);
      gl.uniform2f(locs.resolution, canvas.width, canvas.height);
      gl.uniform1f(locs.time,      elapsed);
      gl.uniform1f(locs.pixelSize, p.pixelSize * dpr);
      gl.uniform1f(locs.scale,     p.patternScale);
      gl.uniform1f(locs.density,   p.patternDensity);
      gl.uniform1f(locs.jitter,    p.pixelSizeJitter);
      gl.uniform1i(locs.ripples,   p.enableRipples ? 1 : 0);
      gl.uniform1f(locs.rSpeed,    p.rippleSpeed);
      gl.uniform1f(locs.rThick,    p.rippleThickness);
      gl.uniform1f(locs.rIntensity,p.rippleIntensityScale);
      gl.uniform1f(locs.edgeFade,  p.edgeFade);
      gl.uniform1i(locs.shape,     SHAPE_MAP[p.variant] ?? 0);

      for(let i=0;i<MAX_CLICKS;i++){
        gl.uniform2f(locs.clickPos[i],   clicks[i].x, clicks[i].y);
        gl.uniform1f(locs.clickTimes[i], clicks[i].t);
      }

      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    stateRef.current = { gl, prog, ro, raf, canvas };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      gl.deleteProgram(prog);
    };
  }, []); // init once — props flow through propsRef

  return (
    <canvas
      ref={canvasRef}
      className={`pixel-blast-container ${className ?? ''}`}
      style={{ display:'block', width:'100%', height:'100%', ...style }}
      aria-label="PixelBlast interactive background"
    />
  );
};

export default PixelBlast;
