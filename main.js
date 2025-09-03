import { animalTypes } from './settingsModal.js';

const animals = [];
const worker = new Worker('worker.js');
let modelReady = false;

worker.onmessage = e => {
  if (e.data.status !== undefined) {
    document.getElementById('status').innerText = `Обучение: ${e.data.status}%`;
    if (e.data.status === 100) modelReady = true;
  }
};

class Animal {
  constructor(type) {
    this.type = type;
    this.size = type.size || (30 + Math.random() * 60);
    this.mass = this.size / 30;
    this.x = type.x !== undefined ? type.x : Math.random() * window.innerWidth;
    this.y = type.y !== undefined ? type.y : Math.random() * window.innerHeight;
    this.vx = type.fixed ? 0 : (Math.random() - 0.5) * 0.5 * (type.speed || 1);
    this.vy = type.fixed ? 0 : (Math.random() - 0.5) * 0.5 * (type.speed || 1);
    this.fixed = !!type.fixed;
    this.url = type.url;

    this.el = document.createElement('div');
    this.el.className = 'animal';
    this.el.style.width = `${this.size}px`;
    this.el.style.height = `${this.size}px`;

    const img = document.createElement('img');
    img.src = this.url;
    this.el.appendChild(img);
    document.body.appendChild(this.el);

    this.box = document.createElement('div');
    this.box.style = 'position:absolute;color:lime;font:bold 12px monospace';
    document.body.appendChild(this.box);
  }

  async update() {
    if (!this.fixed) {
      this.x += this.vx;
      this.y += this.vy;
    }

    this.el.style.transform = `translate(${this.x}px,${this.y}px)`;

    if (modelReady) {
      const tensor = tf.browser.fromPixels(this.el).resizeNearestNeighbor([64,64])
        .toFloat().div(255).expandDims();
      const data = Array.from(tensor.dataSync());
      worker.postMessage({ type: 'predict', data });
      worker.onmessage = ev => {
        if (ev.data.pred !== undefined) {
          const pct = Math.min(99, Math.round(ev.data.pred * 100));
          this.box.style.left = `${this.x + this.size}px`;
          this.box.style.top = `${this.y}px`;
          this.box.innerText = `${pct}%`;
        }
      };
    }
  }

  destroy() {
    this.el.remove();
    this.box.remove();
  }
}

function spawnAnimals() {
  animals.forEach(a => a.destroy());
  animals.length = 0;
  animalTypes.forEach(type =>
    Array.from({ length: type.count }).forEach(() => animals.push(new Animal(type)))
  );
}

function animate() {
  spawnAnimals();
  (function loop() {
    animals.forEach(a => a.update());
    requestAnimationFrame(loop);
  })();
}

//  Созвездия
function spawnConstellation(type = 'big') {
  const count = 6;
  const centerX = Math.random() * window.innerWidth;
  const centerY = Math.random() * window.innerHeight;
  const radius = 100;

  const label = document.createElement('div');
  label.innerText = `Созвездие ${type === 'big' ? 'Большой' : 'Маленькой'} курицы`;
  label.style = `
    position:absolute;
    top:${centerY - radius - 30}px;
    left:${centerX - 50}px;
    color:#ffcc00;
    font:bold 14px monospace;
    text-shadow: 0 0 5px #000;
  `;
  document.body.appendChild(label);

  const group = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 2 * Math.PI;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    const animal = new Animal({
      url: 'https://img.freepik.com/premium-psd/beautiful-chicken-transparent-background_888418-28247.jpg',
      size: type === 'big' ? 80 : 30,
      x, y,
      fixed: true
    });

    animals.push(animal);
    group.push(animal);
  }

  setTimeout(() => {
    group.forEach((animal, i) =>
      setTimeout(() => {
        animal.el.style.transition = 'opacity 2s';
        animal.el.style.opacity = 0;
        animal.box.style.opacity = 0;
        setTimeout(() => animal.destroy(), 2000);
      }, i * 200)
    );
    label.remove();
  }, 10000);
}

setInterval(() => spawnConstellation(Math.random() > 0.5 ? 'big' : 'small'), 15000);

window.onload = () => {
  worker.postMessage({ type: 'init' });
  animate();
};
