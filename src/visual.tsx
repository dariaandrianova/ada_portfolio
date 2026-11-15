import { useEffect, useRef, useState, type RefObject } from 'react';
import { warpConfig, glassConfig } from './config';

const vertex = `attribute vec2 aPosition; varying vec2 vUV; void main(){ vUV=aPosition*.5+.5; gl_Position=vec4(aPosition,0.,1.); }`;
const fragment = `precision highp float;
varying vec2 vUV;
uniform sampler2D uImage,uInput,uFrost;
uniform float uPass;
uniform vec2 uBlurAxis;
uniform vec2 uSize;
uniform vec4 uAvatar;
uniform vec4 uCards[3];
uniform vec3 uRadii;
uniform vec2 uDirection;
uniform vec2 uCenter;
uniform float uTime,uAmplitude,uScale,uBlur,uRefraction,uSpecular,uFill,uChromatic,uLight,uStaticStretch,uRefractionRadius,uBevel,uDepth,uSplay;
const vec3 background=vec3(25.,22.,24.)/255.;
vec4 portrait(vec2 p){
 vec2 uv=(p-uAvatar.xy)/uAvatar.zw;
 // Local elastic field: two soft regions leave other areas almost stationary.
 vec2 q=uv-uCenter;
 float patch=exp(-dot(q*vec2(1.5,2.5),q*vec2(1.5,2.5))*3.5);
 float other=exp(-dot((uv-vec2(.27,.63))*vec2(3.,2.),(uv-vec2(.27,.63))*vec2(3.,2.))*3.);
 float band=sin((uv.x+uv.y)*3.4*uScale+uTime*.27);
 float envelope=.62+.38*sin(uTime*.57+.8);
 // Fixed diagonal Sine-like bias approximates the embedded Figma Warp preview.
 vec2 diagonal=vec2(.7071,-.7071);
 vec2 baseCenter=uv-vec2(.55,.44);
 float baseRegion=exp(-dot(baseCenter*vec2(.85,1.15),baseCenter*vec2(.85,1.15))*1.5);
 float bias=dot(baseCenter,diagonal)*uStaticStretch*baseRegion;
 uv-=vec2(.7071,-.7071)*bias+uDirection*uAmplitude*envelope*(patch*band+.32*other);
 if(uv.x<0.||uv.y<0.||uv.x>1.||uv.y>1.) return vec4(0.);
 return texture2D(uImage,uv);
}
vec3 scene(vec2 p){vec4 c=portrait(p);return mix(background,c.rgb,c.a);}
float roundedDistance(vec2 p,vec2 halfSize,float radius){vec2 q=abs(p)-halfSize+radius;return min(max(q.x,q.y),0.)+length(max(q,0.))-radius;}
// A rounded thick lens: broad curved shoulders (Splay), interior refraction,
// wavelength-dependent sampling (Dispersion), and a full Frost kernel.
vec3 glass(vec2 p,vec4 rect,float radius,vec3 under){
 vec2 local=p-rect.xy-rect.zw*.5;
 float sd=roundedDistance(local,rect.zw*.5,radius);
 if(sd>1.5)return under;
 vec2 extent=rect.zw*.5;
 vec2 nearest=clamp(local,-extent+radius,extent-radius);
 vec2 delta=local-nearest;
 // Rounded-rectangle distance gradient, including straight sides.
 vec2 distances=extent-abs(local);
 vec2 side=distances.x<distances.y ? vec2(sign(local.x),0.) : vec2(0.,sign(local.y));
 vec2 normal=length(delta)>.001 ? normalize(delta) : side;
 float shoulder=max(8.,min(uRefractionRadius,min(extent.x,extent.y))*.64*uSplay);
 float edge=1.-smoothstep(0.,shoulder,max(-sd,0.));
 float slope=edge*edge*(3.-2.*edge);
 float thickness=uDepth;
 // A shallow interior dome also refracts the center; no unchanged sharp center patch.
 vec2 dome=local/extent;
 vec2 offset=(normal*slope*.46 + dome*.075)*thickness*uRefraction;
 vec2 bent=p-offset;
 // The source was blurred in two separable GPU passes, so refraction samples
 // a continuous frosted texture instead of duplicating sparse image taps.
 vec2 frostUV=vec2(bent.x/uSize.x,1.-bent.y/uSize.y);
 vec2 dispersion=normal*uChromatic*(1.5+slope*5.)/uSize;
 dispersion.y=-dispersion.y;
 vec3 color=vec3(texture2D(uFrost,frostUV+dispersion).r,
                 texture2D(uFrost,frostUV).g,
                 texture2D(uFrost,frostUV-dispersion).b)*(1.-uFill);
 vec2 light=vec2(cos(uLight),sin(uLight));
 float lighting=pow(max(dot(normal,light),0.),2.);
 float rim=exp(-abs(sd+.7)*1.7/max(uBevel,.1));
 // Soft light on the bevel, not a new gradient painted across the card.
 color+=vec3(uSpecular*(rim*(.018+.12*lighting)+slope*.018*lighting));
 return mix(under,color,1.-smoothstep(-.5,1.,sd));
}
void main(){
 vec2 p=vec2(vUV.x,1.-vUV.y)*uSize;
 if(uPass<.5){gl_FragColor=vec4(scene(p),1.);return;}
 if(uPass<1.5){
  vec2 stepUV=uBlurAxis*uBlur*.5;
  vec3 c=texture2D(uInput,vUV).rgb*.2270270270;
  c+=texture2D(uInput,vUV+stepUV*1.3846153846).rgb*.3162162162;
  c+=texture2D(uInput,vUV-stepUV*1.3846153846).rgb*.3162162162;
  c+=texture2D(uInput,vUV+stepUV*3.2307692308).rgb*.0702702703;
  c+=texture2D(uInput,vUV-stepUV*3.2307692308).rgb*.0702702703;
  gl_FragColor=vec4(c,1.);return;
 }
 vec3 c=scene(p);
 c=glass(p,uCards[0],uRadii.x,c);
 c=glass(p,uCards[1],uRadii.y,c);
 c=glass(p,uCards[2],uRadii.z,c);
 gl_FragColor=vec4(c,1.);
}`;

export function Visual({ stage }: { stage: RefObject<HTMLElement> }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [generation, setGeneration] = useState(0);
  useEffect(() => {
    const element = canvas.current, root = stage.current;
    if (!element || !root) return;
    const gl = element.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power', depth: false, stencil: false });
    if (!gl) return;
    const resources: WebGLShader[] = [];
    const shader = (type: number, source: string) => {
      const s = gl.createShader(type); if (!s) throw Error('Shader allocation failed');
      resources.push(s); gl.shaderSource(s, source); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(s) || 'Shader compilation failed');
      return s;
    };
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    let texture: WebGLTexture | null = null;
    const targets: { texture: WebGLTexture; framebuffer: WebGLFramebuffer }[] = [];
    let raf = 0, loaded = false, lost = false, disposed = false;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const image = new Image();
    const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-glass]'));
    const location = (name: string) => gl.getUniformLocation(program!, name);
    const vec = (name: string, x: number, y: number) => gl.uniform2f(location(name), x, y);
    let bounds: number[] = [];
    let start = performance.now(), elapsed = 0, previous = start;
    let angle = warpConfig.direction, fromAngle = angle, targetAngle = angle;
    let center = [.55,.39], fromCenter = [...center], targetCenter = [...center];
    let changedAt = 0, nextChange = warpConfig.directionInterval[0];
    function layout() {
      if (!program || disposed || lost) return;
      const w = root!.offsetWidth, h = root!.offsetHeight;
      // Cap fill rate for high-DPI laptops; effect coordinates remain in design pixels.
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      element!.width = Math.round(w*ratio); element!.height = Math.round(h*ratio);
      gl!.viewport(0,0,element!.width,element!.height); vec('uSize',w,h);
      for(const target of targets){
        gl!.activeTexture(gl!.TEXTURE1);gl!.bindTexture(gl!.TEXTURE_2D,target.texture);
        gl!.texImage2D(gl!.TEXTURE_2D,0,gl!.RGBA,element!.width,element!.height,0,gl!.RGBA,gl!.UNSIGNED_BYTE,null);
      }
      gl!.activeTexture(gl!.TEXTURE0);
      const mobile = w < 760;
      const portraitWidth = mobile ? 600 : Math.max(w*.84,h*1.30);
      gl!.uniform4f(location('uAvatar'),mobile ? -94 : w*.30,mobile ? 40 : -h*.25,portraitWidth,portraitWidth*1448/1086);
      const rootRect = root!.getBoundingClientRect();
      const scaleX = rootRect.width/w, scaleY = rootRect.height/h;
      bounds=cards.flatMap(c=>{const rect=c.getBoundingClientRect();return [(rect.left-rootRect.left)/scaleX,(rect.top-rootRect.top)/scaleY,c.offsetWidth,c.offsetHeight];});
      gl!.uniform4fv(location('uCards[0]'),new Float32Array(bounds));
      gl!.uniform3f(location('uRadii'),mobile ? 32 : 40,20,20);
      render(performance.now());
    }
    function render(now: number) {
      cancelAnimationFrame(raf);
      if (!loaded || lost || disposed || !program) return;
      const dt=Math.min((now-previous)/1000,.05);previous=now;
      if (!media.matches && !document.hidden) elapsed+=dt;
      if (elapsed>nextChange) {
        fromAngle=angle;fromCenter=[...center];
        // Select a single new diagonal. Smooth interpolation prevents a reset or a snap.
        const directions=[-Math.PI/4,Math.PI*3/4,Math.PI/4,-Math.PI*3/4].filter(a=>Math.abs(Math.atan2(Math.sin(a-angle),Math.cos(a-angle)))>.5);
        targetAngle=directions[Math.floor(Math.random()*directions.length)];
        while(targetAngle-fromAngle>Math.PI)targetAngle-=2*Math.PI;
        while(targetAngle-fromAngle< -Math.PI)targetAngle+=2*Math.PI;
        targetCenter=[.3+Math.random()*.4,.28+Math.random()*.36];changedAt=elapsed;
        nextChange=elapsed+warpConfig.directionInterval[0]+Math.random()*(warpConfig.directionInterval[1]-warpConfig.directionInterval[0]);
      }
      const a=Math.min((elapsed-changedAt)/warpConfig.transitionSmoothness,1),s=a*a*a*(a*(a*6-15)+10);
      angle=fromAngle+(targetAngle-fromAngle)*s;
      center=fromCenter.map((v,i)=>v+(targetCenter[i]-v)*s);
      vec('uDirection',Math.cos(angle),Math.sin(angle));vec('uCenter',center[0],center[1]);
      gl!.uniform1f(location('uTime'),media.matches ? 0 : elapsed*warpConfig.speed);
      gl!.uniform1f(location('uAmplitude'),media.matches ? 0 : warpConfig.amplitude);
      // Unbind render targets from all samplers before drawing into them.
      gl!.activeTexture(gl!.TEXTURE1);gl!.bindTexture(gl!.TEXTURE_2D,texture);
      gl!.activeTexture(gl!.TEXTURE2);gl!.bindTexture(gl!.TEXTURE_2D,texture);
      gl!.activeTexture(gl!.TEXTURE0);
      // 1: warped scene. 2–3: Gaussian frost. 4: lens compositing and crisp DOM text.
      gl!.uniform1f(location('uPass'),0);
      gl!.bindFramebuffer(gl!.FRAMEBUFFER,targets[0].framebuffer);
      gl!.drawArrays(gl!.TRIANGLES,0,6);
      gl!.uniform1f(location('uPass'),1);
      gl!.activeTexture(gl!.TEXTURE1);gl!.bindTexture(gl!.TEXTURE_2D,targets[0].texture);
      vec('uBlurAxis',1/root!.offsetWidth,0);
      gl!.bindFramebuffer(gl!.FRAMEBUFFER,targets[1].framebuffer);
      gl!.drawArrays(gl!.TRIANGLES,0,6);
      gl!.bindTexture(gl!.TEXTURE_2D,targets[1].texture);
      vec('uBlurAxis',0,1/root!.offsetHeight);
      gl!.bindFramebuffer(gl!.FRAMEBUFFER,targets[2].framebuffer);
      gl!.drawArrays(gl!.TRIANGLES,0,6);
      gl!.uniform1f(location('uPass'),2);
      gl!.activeTexture(gl!.TEXTURE2);gl!.bindTexture(gl!.TEXTURE_2D,targets[2].texture);
      gl!.bindFramebuffer(gl!.FRAMEBUFFER,null);
      gl!.drawArrays(gl!.TRIANGLES,0,6);
      gl!.activeTexture(gl!.TEXTURE0);
      if(!media.matches&&!document.hidden)raf=requestAnimationFrame(render);
    }
    const resume=()=>{previous=performance.now();render(previous);};
    const onLost=(event: Event)=>{event.preventDefault();lost=true;cancelAnimationFrame(raf);delete root!.dataset.gpu;};
    // Remounting on context restoration rebuilds all GPU resources cleanly.
    const onRestored=()=>{setGeneration(value=>value+1);};
    let observer: ResizeObserver | undefined;
    try {
      program=gl.createProgram(); if(!program)throw Error('Program allocation failed');
      gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program)||'Program link failed');
      gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      const pos=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
      texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      for(let i=0;i<3;i++){
        const targetTexture=gl.createTexture(), framebuffer=gl.createFramebuffer();
        if(!targetTexture||!framebuffer)throw Error('Glass buffer allocation failed');
        gl.bindTexture(gl.TEXTURE_2D,targetTexture);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
        gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,targetTexture,0);
        targets.push({texture:targetTexture,framebuffer});
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.uniform1i(location('uInput'),1);gl.uniform1i(location('uFrost'),2);
      gl.uniform1i(location('uImage'),0);gl.uniform1f(location('uScale'),warpConfig.deformationScale);
      gl.uniform1f(location('uStaticStretch'),warpConfig.staticDiagonalStretch);
      gl.uniform1f(location('uRefractionRadius'),glassConfig.refractionRadius);
      gl.uniform1f(location('uBevel'),glassConfig.bevelSize);
      gl.uniform1f(location('uDepth'),glassConfig.depth);
      gl.uniform1f(location('uSplay'),glassConfig.splay/100);
      gl.uniform1f(location('uBlur'),glassConfig.blur);gl.uniform1f(location('uRefraction'),glassConfig.refractionIntensity);
      gl.uniform1f(location('uSpecular'),glassConfig.specularIntensity);gl.uniform1f(location('uFill'),glassConfig.fillOpacity);
      gl.uniform1f(location('uChromatic'),glassConfig.dispersion/100);gl.uniform1f(location('uLight'),glassConfig.specularAngle*Math.PI/180);
      image.onload=()=>{
        if(disposed||lost)return;
        gl!.bindTexture(gl!.TEXTURE_2D,texture);gl!.texImage2D(gl!.TEXTURE_2D,0,gl!.RGBA,gl!.RGBA,gl!.UNSIGNED_BYTE,image);
        loaded=true;root!.dataset.gpu='true';layout();
      };
      image.src='./assets/avatar-transparent.png';
      observer=new ResizeObserver(layout);observer.observe(root);cards.forEach(c=>observer!.observe(c));
      document.fonts.ready.then(()=>{if(!disposed)layout();});
      window.addEventListener('resize',layout);media.addEventListener('change',resume);document.addEventListener('visibilitychange',resume);
      element.addEventListener('webglcontextlost',onLost);element.addEventListener('webglcontextrestored',onRestored);
    } catch(error) { console.warn('Avatar uses its static fallback:',error); }
    return ()=>{
      disposed=true;cancelAnimationFrame(raf);observer?.disconnect();image.onload=null;
      window.removeEventListener('resize',layout);media.removeEventListener('change',resume);document.removeEventListener('visibilitychange',resume);
      element.removeEventListener('webglcontextlost',onLost);element.removeEventListener('webglcontextrestored',onRestored);
      targets.forEach(t=>{gl.deleteTexture(t.texture);gl.deleteFramebuffer(t.framebuffer);});
      gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);resources.forEach(s=>gl.deleteShader(s));delete root.dataset.gpu;
    };
  },[stage,generation]);
  return <><img className="avatar-fallback" src="./assets/avatar-transparent.png" alt="Портрет Дарьи Андриановой" aria-hidden="true" /><canvas ref={canvas} className="visual" aria-hidden="true" /></>;
}
