gsap.registerPlugin(ScrollTrigger);

// ═══════════════════════════════════════════════
// 1. BUTTERFLY CURSOR + SPARKLE TRAIL
// ═══════════════════════════════════════════════
const butterflyCursor = document.getElementById('butterfly-cursor');
let cursorX = 0, cursorY = 0;
let smoothX = window.innerWidth / 2, smoothY = window.innerHeight / 2;

window.addEventListener('mousemove', e => {
  const dx = e.clientX - cursorX;
  const dy = e.clientY - cursorY;
  const speed = Math.sqrt(dx*dx + dy*dy);
  cursorX = e.clientX;
  cursorY = e.clientY;
  if (speed > 4) createSparkles(cursorX, cursorY, speed);
});

// Smooth butterfly follow with rotation
(function animateCursor() {
  smoothX += (cursorX - smoothX) * 0.1;
  smoothY += (cursorY - smoothY) * 0.1;
  const angle = Math.atan2(cursorY - smoothY, cursorX - smoothX) * (180 / Math.PI);
  gsap.set(butterflyCursor, { x: smoothX, y: smoothY, rotation: angle - 90 });
  requestAnimationFrame(animateCursor);
})();

// Scale butterfly on hover over interactive elements
document.querySelectorAll('a, button, .tilt-card, .gal-item').forEach(el => {
  el.addEventListener('mouseenter', () =>
    gsap.to(butterflyCursor, { scale: 1.6, duration: 0.3, ease: 'back.out(2)' })
  );
  el.addEventListener('mouseleave', () =>
    gsap.to(butterflyCursor, { scale: 1, duration: 0.4, ease: 'elastic.out(1,0.5)' })
  );
});

// ─── Sparkle Trail Canvas ────────────────────────
const sparkleCanvas = document.createElement('canvas');
sparkleCanvas.style.cssText =
  'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9997';
sparkleCanvas.width  = window.innerWidth;
sparkleCanvas.height = window.innerHeight;
document.body.appendChild(sparkleCanvas);
const sCtx = sparkleCanvas.getContext('2d');
const sparkles = [];

function createSparkles(x, y, speed) {
  const count = Math.min(Math.floor(speed / 6), 5);
  for (let i = 0; i < count; i++) {
    sparkles.push({
      x: x + (Math.random()-0.5)*24,
      y: y + (Math.random()-0.5)*24,
      size: Math.random()*3.5 + 1.5,
      vx: (Math.random()-0.5)*2.5,
      vy: -Math.random()*2.5 - 0.5,
      life: 1,
      color: Math.random() > 0.45 ? '#D4AF37' : '#FFF8CC'
    });
  }
}

function drawStar(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const rad = i % 2 === 0 ? r : r * 0.4;
    const a   = (i * Math.PI) / 4 - Math.PI / 2;
    ctx[i === 0 ? 'moveTo' : 'lineTo'](x + Math.cos(a)*rad, y + Math.sin(a)*rad);
  }
  ctx.closePath();
}

(function animateSparkles() {
  sCtx.clearRect(0, 0, sparkleCanvas.width, sparkleCanvas.height);
  for (let i = sparkles.length - 1; i >= 0; i--) {
    const s = sparkles[i];
    s.x += s.vx; s.y += s.vy; s.vy += 0.06; s.life -= 0.035;
    if (s.life <= 0) { sparkles.splice(i, 1); continue; }
    sCtx.globalAlpha = s.life * 0.9;
    sCtx.fillStyle   = s.color;
    sCtx.shadowColor = s.color;
    sCtx.shadowBlur  = 8;
    drawStar(sCtx, s.x, s.y, s.size);
    sCtx.fill();
  }
  sCtx.globalAlpha = 1; sCtx.shadowBlur = 0;
  requestAnimationFrame(animateSparkles);
})();

// ─── Background Shimmering Butterflies (triggered after hero anim) ──
const bgCanvas = document.getElementById('bg-butterflies');
bgCanvas.width  = window.innerWidth;
bgCanvas.height = window.innerHeight;
bgCanvas.style.opacity = '0';
const bgCtx = bgCanvas.getContext('2d');

class BgButterfly {
  constructor(index) {
    this.index       = index;
    this.launched    = false;
    this.launchDelay = index * 500; // well-spaced stagger
    this.init();
  }

  init() {
    // Start from left or right edge, at a RANDOM Y across the full screen height
    const fromLeft = this.index % 2 === 0;
    this.x  = fromLeft ? -60 : window.innerWidth + 60;
    this.y  = Math.random() * window.innerHeight; // full height range
    this.vx = 0;
    this.vy = 0;
    this.size     = Math.random() * 12 + 8;
    this.wingAng  = 0;
    this.wingSpd  = Math.random() * 0.18 + 0.10;
    this.maxOp    = Math.random() * 0.18 + 0.06;
    this.isGold   = Math.random() > 0.5;
    this.topSpeed = Math.random() * 0.9 + 0.4;
    this.time     = Math.random() * Math.PI * 2;
    this.pickWaypoint();
  }

  pickWaypoint() {
    // Full screen — butterflies can fly anywhere, corners included
    this.wx = Math.random() * window.innerWidth;
    this.wy = Math.random() * window.innerHeight;
    this.wpLife = Math.random() * 160 + 80;
    this.wpAge  = 0;
  }

  launch() { this.launched = true; }

  update() {
    if (!this.launched) return;

    this.time    += 0.02;
    this.wingAng += this.wingSpd;
    this.wpAge++;

    const dx   = this.wx - this.x;
    const dy   = this.wy - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Arrived at waypoint or timeout → pick a new one
    if (dist < 40 || this.wpAge > this.wpLife) this.pickWaypoint();

    // Steer gently toward waypoint (not instant — gives natural curves)
    const steer = 0.012;
    this.vx += (dx / dist) * steer;
    this.vy += (dy / dist) * steer;

    // Small random turbulence — erratic flutter
    this.vx += (Math.random() - 0.5) * 0.04;
    this.vy += (Math.random() - 0.5) * 0.04;

    // Cap speed
    const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (spd > this.topSpeed) {
      this.vx = (this.vx / spd) * this.topSpeed;
      this.vy = (this.vy / spd) * this.topSpeed;
    }

    this.x += this.vx;
    this.y += this.vy;

    // If drifted off-screen, reinit from edge
    const W = window.innerWidth, H = window.innerHeight;
    if (this.x < -120 || this.x > W + 120 || this.y < -120 || this.y > H + 120) {
      this.init();
      this.launched = true;
    }
  }

  draw(ctx) {
    if (!this.launched) return;

    const s   = this.size;
    const wf  = Math.sin(this.wingAng); // wing flap -1..1
    const op  = this.maxOp * (0.5 + 0.5 * Math.abs(Math.sin(this.time * 2.5)));
    const fill = this.isGold ? '#D4AF37' : '#FFFBE0';
    const glow = this.isGold ? 'rgba(212,175,55,0.6)' : 'rgba(255,252,200,0.6)';

    // Rotate butterfly to face direction of travel
    const angle = Math.atan2(this.vy, this.vx) + Math.PI / 2;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);
    ctx.globalAlpha = op;
    ctx.shadowColor = glow;
    ctx.shadowBlur  = 12;
    ctx.fillStyle   = fill;

    // Left wings
    ctx.save();
    ctx.transform(wf, 0, 0, 1, 0, 0);
    // Upper left
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-s, -s * 0.8, -s * 1.6, -s * 0.15, -s * 0.75, s * 0.2);
    ctx.bezierCurveTo(-s * 0.3, s * 0.4, -s * 0.08, s * 0.08, 0, 0);
    ctx.fill();
    // Lower left
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-s * 0.7, s * 0.25, -s, s * 0.9, -s * 0.35, s * 0.75);
    ctx.bezierCurveTo(-s * 0.12, s * 0.6, -s * 0.04, s * 0.3, 0, 0);
    ctx.fill();
    ctx.restore();

    // Right wings (mirrored)
    ctx.save();
    ctx.transform(-wf, 0, 0, 1, 0, 0);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-s, -s * 0.8, -s * 1.6, -s * 0.15, -s * 0.75, s * 0.2);
    ctx.bezierCurveTo(-s * 0.3, s * 0.4, -s * 0.08, s * 0.08, 0, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-s * 0.7, s * 0.25, -s, s * 0.9, -s * 0.35, s * 0.75);
    ctx.bezierCurveTo(-s * 0.12, s * 0.6, -s * 0.04, s * 0.3, 0, 0);
    ctx.fill();
    ctx.restore();

    // Body
    ctx.shadowBlur = 3;
    ctx.fillStyle  = this.isGold ? '#F7E270' : '#FFFFE0';
    ctx.beginPath();
    ctx.ellipse(0, 2, s * 0.09, s * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

const BUTTERFLY_COUNT = 7; // minimal — elegant
const bgButterflies = Array.from({ length: BUTTERFLY_COUNT }, (_, i) => new BgButterfly(i));

function runBgLoop() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  bgButterflies.forEach(b => { b.update(); b.draw(bgCtx); });
  requestAnimationFrame(runBgLoop);
}

function launchButterflies() {
  bgCanvas.style.transition = 'opacity 1.5s ease';
  bgCanvas.style.opacity    = '1';
  runBgLoop();
  bgButterflies.forEach(b => setTimeout(() => b.launch(), b.launchDelay));
}

// Resize handling
window.addEventListener('resize', () => {
  sparkleCanvas.width = bgCanvas.width = window.innerWidth;
  sparkleCanvas.height = bgCanvas.height = window.innerHeight;
});




// ═══════════════════════════════════════════════
// 2. NAVBAR SCROLL EFFECT
// ═══════════════════════════════════════════════
const navbar = document.getElementById('navbar');
ScrollTrigger.create({
  start: 'top -80',
  onUpdate: self => {
    navbar.classList.toggle('scrolled', self.scroll() > 80);
  }
});

// ═══════════════════════════════════════════════
// 3. HERO ENTRANCE ANIMATION
// ═══════════════════════════════════════════════
const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.4 });

heroTl
  .to('#hero-eyebrow', { opacity: 1, y: 0, duration: 0.9 })
  .to('.hero-title',   { opacity: 1, y: 0, duration: 1.0 }, '-=0.4')
  .to('#hero-subtitle',{ opacity: 1, y: 0, duration: 0.8 }, '-=0.5')
  .to('#hero-buttons', { opacity: 1, y: 0, duration: 0.8 }, '-=0.5')
  .to('#hero-stats',   { opacity: 1, y: 0, duration: 0.8, onComplete: launchButterflies }, '-=0.4');

// ═══════════════════════════════════════════════
// 4. ROTATING WORD CYCLE
// ═══════════════════════════════════════════════
const rotatingWords = ['Passion', 'Elegance', 'Artistry', 'Precision', 'Love'];
let wordIndex = 0;
const rotatingEl = document.getElementById('rotating-word');

function cycleWord() {
  gsap.to(rotatingEl, {
    y: '-110%', opacity: 0, duration: 0.5, ease: 'power2.in',
    onComplete: () => {
      wordIndex = (wordIndex + 1) % rotatingWords.length;
      rotatingEl.textContent = rotatingWords[wordIndex];
      gsap.fromTo(rotatingEl,
        { y: '110%', opacity: 0 },
        { y: '0%',   opacity: 1, duration: 0.6, ease: 'power3.out' }
      );
    }
  });
}
setTimeout(() => setInterval(cycleWord, 2500), 2500);

// ═══════════════════════════════════════════════
// HERO TEXT LIVE ANIMATIONS (start after entrance)
// ═══════════════════════════════════════════════
heroTl.eventCallback('onComplete', () => {

  // 1. ── Letter-wave on "Crafted with" ──────────
  const staticEl = document.querySelector('.title-static');
  if (staticEl) {
    staticEl.innerHTML = [...staticEl.textContent]
      .map(ch => `<span class="wave-ch" style="display:inline-block">${ch === ' ' ? '\u00a0' : ch}</span>`)
      .join('');

    gsap.to('.wave-ch', {
      y: -12,
      duration: 0.55,
      ease: 'sine.inOut',
      stagger: { each: 0.07, repeat: -1, yoyo: true }
    });
  }

  // 2. ── Subtle X-swing on the rotating word ─────
  gsap.to('.title-rotating-wrapper', {
    x: 8,
    duration: 3,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1
  });

  // 3. ── Eyebrow line breathes ───────────────────
  gsap.to('.eyebrow-line', {
    scaleX: 1.8,
    duration: 1.8,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
    transformOrigin: 'left center'
  });

  // 4. ── Stat numbers float independently ────────
  gsap.to('.stat-number', {
    y: -6,
    duration: 2,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
    stagger: { each: 0.5 }
  });

  // 5. ── Subtitle shimmer shine sweep ───────────
  // Driven by a fast-moving gradient via GSAP
  gsap.fromTo('.hero-subtitle',
    { backgroundPosition: '-200% center' },
    {
      backgroundPosition: '200% center',
      duration: 4,
      ease: 'none',
      repeat: -1,
      repeatDelay: 1
    }
  );
});



// ═══════════════════════════════════════════════
// 5. MAGNETIC BUTTONS
// ═══════════════════════════════════════════════
document.querySelectorAll('.magnetic-btn').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = (e.clientX - cx) * 0.35;
    const dy = (e.clientY - cy) * 0.35;
    gsap.to(btn, { x: dx, y: dy, duration: 0.4, ease: 'power3.out' });
  });
  btn.addEventListener('mouseleave', () => {
    gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
  });
});

// ═══════════════════════════════════════════════
// 6. 3D TILT CARDS
// ═══════════════════════════════════════════════
document.querySelectorAll('.tilt-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 20;
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * -20;
    gsap.to(card, {
      rotateY: x, rotateX: y,
      transformPerspective: 800,
      ease: 'power1.out', duration: 0.4
    });
  });
  card.addEventListener('mouseleave', () => {
    gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
  });
});

// ═══════════════════════════════════════════════
// 7. SCROLL REVEAL — SECTION HEADINGS
// ═══════════════════════════════════════════════
document.querySelectorAll('.reveal-text').forEach(el => {
  // Wrap each character in a span
  const text = el.textContent;
  el.innerHTML = text.split('').map(ch =>
    `<span class="char" style="display:inline-block; overflow:hidden">
       <span class="char-inner" style="display:inline-block; transform:translateY(110%)">${ch === ' ' ? '&nbsp;' : ch}</span>
     </span>`
  ).join('');

  gsap.to(el.querySelectorAll('.char-inner'), {
    y: '0%',
    duration: 0.8,
    stagger: 0.03,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: el,
      start: 'top 85%',
    }
  });
});

// ═══════════════════════════════════════════════
// 8. SCROLL REVEAL — GENERAL ELEMENTS
// ═══════════════════════════════════════════════
const revealEls = [
  { sel: '.cat-card',     y: 60,  stagger: 0.08 },
  { sel: '.product-card', y: 80,  stagger: 0.12 },
  { sel: '.bouquet-item', y: 100, stagger: 0.15 },
  { sel: '.test-card',    y: 50,  stagger: 0.12 },
  { sel: '.gal-item',     y: 40,  stagger: 0.1  },
  { sel: '.about-text',   y: 40,  stagger: 0    },
];

revealEls.forEach(({ sel, y, stagger }) => {
  const els = document.querySelectorAll(sel);
  if (!els.length) return;
  gsap.from(els, {
    y, opacity: 0, duration: 1, stagger,
    ease: 'power3.out',
    scrollTrigger: { trigger: els[0], start: 'top 82%' }
  });
});

// ═══════════════════════════════════════════════
// 9. STAT COUNTER ANIMATION
// ═══════════════════════════════════════════════
document.querySelectorAll('[data-count]').forEach(el => {
  const target = +el.dataset.count;
  ScrollTrigger.create({
    trigger: el,
    start: 'top 90%',
    once: true,
    onEnter: () => {
      gsap.to({ val: 0 }, {
        val: target,
        duration: 2,
        ease: 'power2.out',
        onUpdate: function() {
          el.textContent = Math.round(this.targets()[0].val) + '+';
        }
      });
    }
  });
});

// ═══════════════════════════════════════════════
// 10. GALLERY PARALLAX
// ═══════════════════════════════════════════════
gsap.utils.toArray('.gal-item').forEach(item => {
  gsap.fromTo(item,
    { backgroundPositionY: '0%' },
    { backgroundPositionY: '30%', ease: 'none',
      scrollTrigger: { trigger: item, start: 'top bottom', end: 'bottom top', scrub: true }
    }
  );
});

// ═══════════════════════════════════════════════
// 11. VIDEO FRAME ANIMATION (full-screen canvas)
// ═══════════════════════════════════════════════
const canvas = document.getElementById('video-canvas');
if (canvas) {
  const context = canvas.getContext('2d', { alpha: false });
  const dpr = window.devicePixelRatio || 1;
  const W   = window.innerWidth;
  const H   = window.innerHeight;

  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  context.scale(dpr, dpr);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  const frameCount  = 240;
  const currentFrame = i =>
    `/video-frames-1080p/ezgif-frame-${(i + 1).toString().padStart(3, '0')}.png`;

  const images = [];
  const frames = { frame: 0 };

  for (let i = 0; i < frameCount; i++) {
    const img = new Image();
    img.src = currentFrame(i);
    images.push(img);
  }

  // Color extractor
  const cc  = document.createElement('canvas');
  const cctx = cc.getContext('2d', { willReadFrequently: true });
  cc.width = cc.height = 1;

  function render() {
    const img = images[Math.floor(frames.frame)];
    if (!img?.complete) return;
    context.clearRect(0, 0, W, H);

    // Zoom in 12% to push Veo watermark (bottom-right corner) off screen
    const zoom = 1.12;
    const drawW = W * zoom;
    const drawH = H * zoom;
    const offsetX = (W - drawW) / 2;
    const offsetY = (H - drawH) / 2;
    context.drawImage(img, offsetX, offsetY, drawW, drawH);

    // Dynamic background colour
    cctx.drawImage(img, 0, 0, 1, 1);
    const d = cctx.getImageData(0, 0, 1, 1).data;
    const r = Math.floor(d[0] * 0.55);
    const g = Math.floor(d[1] * 0.55);
    const b = Math.floor(d[2] * 0.55);
    document.body.style.backgroundColor = `rgb(${r},${g},${b})`;
    document.documentElement.style.setProperty('--color-bg', `rgb(${r},${g},${b})`);
  }

  images[0].onload = render;

  gsap.to(frames, {
    frame: frameCount - 1,
    snap: 'frame',
    ease: 'none',
    duration: 8,
    repeat: -1,
    onUpdate: render
  });
}

// ═══════════════════════════════════════════════
// 12. HERO CONTENT PARALLAX
// ═══════════════════════════════════════════════
gsap.to('.hero-layout', {
  y: -150,
  opacity: 0.2, // Fade out softly
  ease: 'none',
  scrollTrigger: {
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    scrub: true
  }
});

// ═══════════════════════════════════════════════
// 13. STAGGERED PARALLAX (GRIDS)
// ═══════════════════════════════════════════════
// Category cards
gsap.utils.toArray('.cat-card').forEach((card, i) => {
  gsap.fromTo(card,
    { y: 0 },
    {
      y: (i % 2 === 0) ? -25 : 25,
      ease: 'none',
      scrollTrigger: {
        trigger: '.categories-grid',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      }
    }
  );
});

// Product cards
gsap.utils.toArray('.product-card').forEach((card, i) => {
  gsap.fromTo(card,
    { y: 0 },
    {
      y: (i % 2 === 0) ? -35 : 35,
      ease: 'none',
      scrollTrigger: {
        trigger: '.product-grid',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      }
    }
  );
});

// ═══════════════════════════════════════════════
// 14. ATMOSPHERIC DUST PARALLAX
// ═══════════════════════════════════════════════
gsap.utils.toArray('.parallax-dust').forEach((dust, i) => {
  gsap.to(dust, {
    y: -800 * ((i % 2) + 0.5), // Variable floating speed upward
    ease: 'none',
    scrollTrigger: {
      trigger: 'body',
      start: 'top top',
      end: 'bottom top',
      endTrigger: 'footer',
      scrub: 2 // smooth lag behind scroll
    }
  });
});

// ═══════════════════════════════════════════════
// 15. BLOOM TRANSITION PIN & SCALE
// ═══════════════════════════════════════════════
const bloomContainer = document.getElementById('bloom-particles');
if (bloomContainer) {
  const numParticles = 20; // Medium amount to fill the line seamlessly
  const flowerImages = ['/images/flower_1.png', '/images/flower_2.png', '/images/flower_3.png'];

  for (let i = 0; i < numParticles; i++) {
    const p = document.createElement('div');
    p.classList.add('bloom-particle');
    p.style.backgroundImage = `url('${flowerImages[i % flowerImages.length]}')`;
    
    // Spawn randomly along the horizontal seam
    p.style.left = `${Math.random() * 100}vw`;
    p.style.top = '0px';
    
    // Medium-large flowers (150px to 250px) to completely obscure the line
    const size = Math.random() * 100 + 150; 
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    
    bloomContainer.appendChild(p);
  }

  const bloomTl = gsap.timeline({
    scrollTrigger: {
      trigger: '.floral-aesthetic-section',
      start: 'top bottom', // Trigger as soon as the floral section enters the viewport
      end: 'top top',      // Finish the animation perfectly as it reaches the top
      scrub: 1
    }
  });

  bloomTl.to('.bloom-particle', {
    opacity: 1,
    scale: () => Math.random() * 0.5 + 1, // subtle growth
    x: () => Math.random() * 200 - 100, // slight horizontal drift
    y: () => Math.random() * (window.innerHeight * 0.4) + 20, // drift mostly down, covering the line
    rotation: () => Math.random() * 90 - 45, // gentle rotation
    stagger: 0.02, 
    ease: 'power2.out',
    duration: 1
  }, 0); // Start at beginning of scrub timeline

  // Fade in the overlay writings/card with 3D Flip & Rotate
  bloomTl.fromTo('.bloom-overlay-content', {
    opacity: 0,
    y: 150,
    rotationX: -90,
    rotationY: 60,
    scale: 0.3
  }, {
    opacity: 1,
    y: 0,
    rotationX: 0,
    rotationY: 0,
    scale: 1,
    duration: 0.8,
    ease: 'power2.out'
  }, 0.2); // Start slightly after flowers begin blooming

  // 360° continuous rotation of the glass card synced to scroll
  gsap.to('.glass-card', {
    rotation: 360,
    ease: 'none',
    scrollTrigger: {
      trigger: '.floral-aesthetic-section',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1 // perfectly tied to scroll speed
    }
  });
}

// ═══════════════════════════════════════════════
// 17. PRODUCT & CATEGORY CARD SCROLL ANIMATIONS
// ═══════════════════════════════════════════════

// Enable 3D perspective on the grids
gsap.set('.categories-grid, .product-grid', { perspective: 1200 });

// Category cards — alternating flip direction per card
document.querySelectorAll('.cat-card').forEach((card, i) => {
  const flipDir = i % 2 === 0 ? 1 : -1; // alternate left/right flip
  const rotDir  = i % 3 === 0 ? 1 : -1; // alternate tilt direction

  gsap.fromTo(card,
    {
      opacity: 0,
      rotationY: flipDir * 90,  // Start fully flipped sideways
      rotationX: rotDir * 25,   // Slight tilt on X axis
      scale: 0.7,
      y: 60
    },
    {
      opacity: 1,
      rotationY: 0,
      rotationX: 0,
      scale: 1,
      y: 0,
      ease: 'back.out(1.4)',
      duration: 1,
      scrollTrigger: {
        trigger: card,
        start: 'top 85%',
        end: 'top 40%',
        scrub: false,
        toggleActions: 'play none none reverse'
      }
    }
  );
});

// Product cards — flip on Y axis as they scroll in, staggered
document.querySelectorAll('.product-card').forEach((card, i) => {
  gsap.fromTo(card,
    {
      opacity: 0,
      rotationY: 180,  // Start fully flipped (showing the back)
      scale: 0.6,
      y: 80
    },
    {
      opacity: 1,
      rotationY: 0,    // Flip to front
      scale: 1,
      y: 0,
      ease: 'power3.out',
      duration: 1.1,
      delay: i * 0.15,
      scrollTrigger: {
        trigger: '#shop',
        start: 'top 75%',
        toggleActions: 'play none none reverse'
      }
    }
  );
});
