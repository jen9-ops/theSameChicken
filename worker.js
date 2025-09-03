importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest');
let model, progress = 0;

async function initModel() {
  model = tf.sequential();
  model.add(tf.layers.conv2d({ inputShape:[64,64,3], filters:8, kernelSize:5, activation:'relu' }));
  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({ units:1, activation:'sigmoid' }));
  model.compile({ loss:'binaryCrossentropy', optimizer:'adam' });
}

self.onmessage = async e => {
  if (e.data.type === 'init') {
    await initModel();
    trainingLoop();
  }
  else if (e.data.type === 'predict') {
    const tensor = tf.tensor(e.data.data, [1,64,64,3]);
    const pred = (await model.predict(tensor).data())[0];
    self.postMessage({ pred });
  }
};

async function trainingLoop() {
  for (let i = 1; i <= 100; i++) {
    const xs = tf.randomNormal([8,64,64,3]);
    const ys = tf.ones([8,1]);
    await model.fit(xs, ys, { epochs:1, batchSize:8 });
    progress = i;
    self.clients.matchAll().then(c => c.forEach(c2 => c2.postMessage({ status: progress })));
    await new Promise(r => setTimeout(r, 200));
  }
}
