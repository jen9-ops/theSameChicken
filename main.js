const ANIMAL_IMG = 'https://img.freepik.com/premium-psd/beautiful-chicken-transparent-background_888418-28247.jpg';
const NUM = 30;
const animals = [];
let modelLoaded = false;
let workerReady = false;

// Setup Web Worker
const worker = new Worker('worker.js');
worker.onmessage = e => {
  if (e.data.status !== undefined) {
    document.getElementById('status').innerText = `Обучение: ${e.data.status}%`;
  }
};
worker.postMessage({ type: 'init' });

class Animal {
  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'animal';
    this.size = 30 + Math.random() * 60;
    this.el.style.width = this.el.style.height = `${this.size}px`;
    this.mass = this.size / 30;

    const img = document.createElement('img');
    img.src = ANIMAL_IMG;
    this.el.appendChild(img);
    document.body.appendChild(this.el);

    this.box = document.createElement('div');
    this.box.style.position = 'absolute';
    this.box.style.color = 'lime';
    this.box.style.font = 'bold 12px monospace';
    document.body.appendChild(this.box);

    this.x = Math.random() * window.innerWidth;
    this.y = Math.random() * window.innerHeight;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
  }

  async update() {
    this.x += this.vx;
    this.y += this.vy;
    this.el.style.transform = `translate(${this.x}px,${this.y}px)`;

    if (modelLoaded && workerReady) {
      const tensor = tf.browser.fromPixels(this.el)
                     .resizeNearestNeighbor([64,64])
                     .toFloat().div(255).expandDims();
      const pred = await workerPredict(tensor);
      const pct = Math.min(99, Math.round(pred * 100));
      this.box.style.left = `${this.x + this.size}px`;
      this.box.style.top = `${this.y}px`;
      this.box.innerText = `${pct}%`;
    }
  }
}

async function workerPredict(tensor) {
  const data = Array.from(tensor.dataSync());
  return new Promise(resolve => {
    const msgId = Math.random();
    worker.postMessage({ type: 'predict', data, id: msgId });
    worker.onmessage = e => {
      if (e.data.id === msgId) {
        resolve(e.data.pred);
      }
    };
  });
}

function animate() {
  animals.forEach(a => a.update());
  requestAnimationFrame(animate);
}

window.onload = () => {
  for (let i = 0; i < NUM; i++) animals.push(new Animal());
  animate();
};
