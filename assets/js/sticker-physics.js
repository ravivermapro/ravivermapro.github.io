/**
 * Sticker & HoverBump Physics Engine
 * Replicates Framer's HoverBumpImage physics (spring damping, ambient float, pointer bump, tactile switch)
 */

(function () {
  'use strict';

  // Math helper
  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  // Pointer velocity tracker
  const pointer = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    lastTime: performance.now(),
    isTouch: false
  };

  window.addEventListener('pointermove', function (e) {
    const now = performance.now();
    const dt = Math.max(8, now - pointer.lastTime);
    const dx = e.clientX - pointer.x;
    const dy = e.clientY - pointer.y;

    pointer.vx = (dx / dt) * 1000;
    pointer.vy = (dy / dt) * 1000;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.lastTime = now;
    pointer.isTouch = e.pointerType === 'touch';
  }, { passive: true });

  class PhysicsItem {
    constructor(el, options = {}) {
      this.el = el;
      this.inner = el.querySelector('.sticker-inner') || el;
      
      this.options = Object.assign({
        floatAmount: 6,
        floatRotate: 1.2,
        duration: 5.5,
        offset: options.offset || 0,
        reactivity: 6,
        maxOffset: 65,
        maxRotate: 24,
        stiffness: 120,
        damping: 22,
        mass: 0.9,
        scaleOnHover: 1.06,
        isPolaroid: false
      }, options);

      // Spring state
      this.currentX = 0;
      this.currentY = 0;
      this.currentRotate = 0;
      this.currentScale = 1;

      this.targetX = 0;
      this.targetY = 0;
      this.targetRotate = 0;
      this.targetScale = 1;

      this.vx = 0;
      this.vy = 0;
      this.vr = 0;
      this.vs = 0;

      this.startTime = performance.now() + (this.options.offset * 1000);
      this.isHovered = false;

      this.initEvents();
    }

    initEvents() {
      const self = this;

      this.el.addEventListener('pointerenter', function () {
        self.isHovered = true;
        self.targetScale = self.options.scaleOnHover;
      });

      this.el.addEventListener('pointerleave', function () {
        self.isHovered = false;
        self.targetX = 0;
        self.targetY = 0;
        self.targetRotate = 0;
        self.targetScale = 1;
      });

      this.el.addEventListener('pointerdown', function () {
        // Tactile spring pop
        self.currentScale = 0.92;
        self.vs = -0.5;
      });

      this.el.addEventListener('pointerup', function () {
        self.currentScale = 1.08;
        self.vs = 0.8;
      });

      this.el.addEventListener('click', function () {
        // Visual switch bounce
        self.triggerBump(pointer.vx || 200, pointer.vy || -200);
      });
    }

    triggerBump(impulseX, impulseY) {
      const mag = Math.hypot(impulseX, impulseY);
      const intensity = clamp(mag / 400, 0.4, 2.0);
      this.vx += (impulseX / (mag || 1)) * 35 * intensity;
      this.vy += (impulseY / (mag || 1)) * 35 * intensity;
      this.vr += ((Math.random() - 0.5) * 20) * intensity;
    }

    update(now, dt) {
      // 1. Ambient harmonic floating
      const t = (now - this.startTime) / 1000;
      const floatX = Math.sin(t * (2 * Math.PI / this.options.duration)) * this.options.floatAmount;
      const floatY = Math.cos(t * (2 * Math.PI / (this.options.duration * 1.15))) * this.options.floatAmount;
      const floatR = Math.sin(t * (2 * Math.PI / (this.options.duration * 1.3))) * this.options.floatRotate;

      // 2. Cursor hover influence
      if (this.isHovered && !pointer.isTouch) {
        const rect = this.el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const normX = clamp((pointer.x - centerX) / (rect.width / 2), -1, 1);
        const normY = clamp((pointer.y - centerY) / (rect.height / 2), -1, 1);

        // Tilt towards / slightly away from cursor with inertia
        this.targetX = normX * (this.options.maxOffset * 0.45);
        this.targetY = normY * (this.options.maxOffset * 0.45);
        this.targetRotate = normX * this.options.maxRotate;
      }

      // 3. Spring physics simulation
      const springK = this.options.stiffness;
      const dampingC = this.options.damping;

      // X spring
      const forceX = -springK * (this.currentX - this.targetX) - dampingC * this.vx;
      this.vx += (forceX / this.options.mass) * dt;
      this.currentX += this.vx * dt;

      // Y spring
      const forceY = -springK * (this.currentY - this.targetY) - dampingC * this.vy;
      this.vy += (forceY / this.options.mass) * dt;
      this.currentY += this.vy * dt;

      // Rotation spring
      const forceR = -springK * (this.currentRotate - this.targetRotate) - dampingC * this.vr;
      this.vr += (forceR / this.options.mass) * dt;
      this.currentRotate += this.vr * dt;

      // Scale spring
      const forceS = -springK * (this.currentScale - this.targetScale) - dampingC * this.vs;
      this.vs += (forceS / this.options.mass) * dt;
      this.currentScale += this.vs * dt;

      // 4. Combine ambient float + dynamic physics
      const totalX = this.currentX + floatX;
      const totalY = this.currentY + floatY;
      const totalR = this.currentRotate + floatR;

      if (this.options.isPolaroid) {
        this.el.style.transform = `perspective(800px) translate3d(${totalX * 0.5}px, ${totalY * 0.5}px, 0) rotate3d(${normY || 0}, ${-normX || 0}, 0, ${totalR}deg) scale(${this.currentScale})`;
      } else {
        this.inner.style.transform = `translate3d(${totalX}px, ${totalY}px, 0) rotate(${totalR}deg) scale(${this.currentScale})`;
      }
    }
  }

  // Physics World Manager
  class PhysicsWorld {
    constructor() {
      this.items = [];
      this.lastTime = performance.now();
      this.running = false;
    }

    addItem(el, options) {
      const item = new PhysicsItem(el, options);
      this.items.push(item);
      if (!this.running) {
        this.start();
      }
      return item;
    }

    start() {
      this.running = true;
      const loop = (now) => {
        const dt = Math.min((now - this.lastTime) / 1000, 0.05); // cap at 50ms
        this.lastTime = now;

        for (let i = 0; i < this.items.length; i++) {
          this.items[i].update(now, dt);
        }

        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  }

  window.PhysicsWorld = new PhysicsWorld();

  // Auto-initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function () {
    // 1. Hero 3D Stickers
    const stickers = document.querySelectorAll('.sticker-container');
    const phaseOffsets = [0, 1.4, 2.8, 4.2];

    stickers.forEach((sticker, idx) => {
      window.PhysicsWorld.addItem(sticker, {
        offset: phaseOffsets[idx % phaseOffsets.length],
        floatAmount: 5 + (idx % 2) * 2,
        duration: 5.2 + (idx * 0.4),
        maxOffset: 55,
        maxRotate: 20
      });
    });

    // 2. Behind the canvas tilt cards
    const polaroids = document.querySelectorAll('.canvas-polaroid');
    polaroids.forEach((card, idx) => {
      card.addEventListener('mousemove', function (e) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const rotateX = (-y / (rect.height / 2)) * 12;
        const rotateY = (x / (rect.width / 2)) * 12;
        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.04) translateY(-10px)`;
      });

      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  });
})();
