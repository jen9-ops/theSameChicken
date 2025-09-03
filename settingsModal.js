const settingsBtn = document.getElementById('settings-btn');
const modal = document.getElementById('modal');
const closeBtn = document.getElementById('close-modal');
const addAnimalBtn = document.getElementById('add-animal-btn');
const animalUrlInput = document.getElementById('animal-url');
const slidersDiv = document.getElementById('sliders');

const animalTypes = []; // {url, count, speed}

settingsBtn.onclick = () => modal.style.display = 'block';
closeBtn.onclick = () => modal.style.display = 'none';

addAnimalBtn.onclick = () => {
  const url = animalUrlInput.value.trim();
  if (!url) return;
  const type = { url, count: 5, speed: 1.0 };
  animalTypes.push(type);
  renderSliders();
  animalUrlInput.value = '';
};

function renderSliders() {
  slidersDiv.innerHTML = '';
  animalTypes.forEach((t, idx) => {
    const container = document.createElement('div');
    const title = document.createElement('div');
    title.innerText = `Животное #${idx+1}`;
    container.appendChild(title);

    ['count','speed'].forEach(prop => {
      const lbl = document.createElement('label');
      lbl.innerText = `${prop}: ${t[prop]}`;
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = prop === 'count' ? 0 : 0.1;
      slider.max = prop === 'count' ? 50 : 5;
      slider.step = prop === 'count' ? 1 : 0.1;
      slider.value = t[prop];
      slider.oninput = e => {
        t[prop] = prop==='count' ? +e.target.value : +e.target.value;
        lbl.innerText = `${prop}: ${t[prop]}`;
      };
      container.appendChild(lbl);
      container.appendChild(slider);
    });

    slidersDiv.appendChild(container);
    slidersDiv.appendChild(document.createElement('hr'));
  });
}

export { animalTypes };
