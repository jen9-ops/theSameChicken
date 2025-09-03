import { animalTypes } from './settingsModal.js';

let ANIMALS = [];
const animals = [];
const NUM_DEFAULT = 20;
const worker = new Worker('worker.js');
worker.onmessage = e => {
  if (e.data.status !== undefined) {
    document.getElementById('status').innerText = `Обучение: ${e.data.status}%`;
  }
};

class Animal {
  constructor(type) {
    this.type = type;
    this.el = document.createElement('div');
    this.el.className = 'animal';
    this.size = 30 + Math.random() * 60;
    this.el.style.width = this.el.style.height = `${this.size}px`;
    this.mass = this.size / 30;

    const img = document.createElement('img');
    img.src = type.url;
    this.el.appendChild(img);
    document.body.appendChild(this.el);

    this.box = document.createElement('div');
    this.box.style = 'position:absolute;color:lime;font:bold 12px monospace';
    document.body.appendChild(this.box);

    this.x = Math.random() * innerWidth;
    this.y = Math.random() * innerHeight;
    this.vx = (Math.random() - 0.5) * 0.5 * type.speed;
    this.vy = (Math.random() - 0.5) * 0.5 * type.speed;
  }

  async update() {
    this.x += this.vx;
    this.y += this.vy;
    this.el.style.transform = `translate(${this.x}px,${this.y}px)`;

    const tensor = tf.browser.fromPixels(this.el).resizeNearestNeighbor([64,64])
      .toFloat().div(255).expandDims();
    const data = Array.from(tensor.dataSync());
    worker.postMessage({type:'predict', data});
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

function spawnAnimals() {
  animals.forEach(a => { a.el.remove(); a.box.remove(); });
  animals.length = 0;
  animalTypes.forEach(type => {
    for (let i = 0; i < type.count; i++) {
      animals.push(new Animal(type));
    }
  });
}

function animate() {
  spawnAnimals();
  (function loop() {
    animals.forEach(a => a.update());
    requestAnimationFrame(loop);
  })();
}

window.onload = () => {
  worker.postMessage({ type:'init' });
  animate();
};
