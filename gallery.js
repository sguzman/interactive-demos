const gallery = document.querySelector('#gallery');
const template = document.querySelector('#cardTemplate');
const searchInput = document.querySelector('#search');
const filterHost = document.querySelector('#tagFilters');
const summary = document.querySelector('#resultSummary');
const count = document.querySelector('#demoCount');
const empty = document.querySelector('#emptyState');

let demos = [];
let activeTag = 'all';

const normalize = value => String(value ?? '').toLowerCase();

function renderFilters() {
  const tags = [...new Set(demos.flatMap(demo => demo.tags ?? []))].sort();
  filterHost.replaceChildren();

  for (const tag of ['all', ...tags]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `filter${tag === activeTag ? ' active' : ''}`;
    button.textContent = tag === 'all' ? 'All' : tag;
    button.addEventListener('click', () => {
      activeTag = tag;
      renderFilters();
      renderGallery();
    });
    filterHost.append(button);
  }
}

function renderFacts(dl, facts = {}) {
  dl.replaceChildren();
  for (const [label, value] of Object.entries(facts)) {
    const wrapper = document.createElement('div');
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = label;
    dd.textContent = value;
    wrapper.append(dt, dd);
    dl.append(wrapper);
  }
}

function makeCard(demo) {
  const card = template.content.firstElementChild.cloneNode(true);
  card.querySelector('.status').textContent = demo.status ?? 'active';
  card.querySelector('.maturity').textContent = demo.maturity ?? 'experiment';
  card.querySelector('.kind').textContent = demo.kind ?? 'interactive demo';
  card.querySelector('h3').textContent = demo.title;
  card.querySelector('.summary').textContent = demo.summary;
  renderFacts(card.querySelector('.facts'), demo.facts);

  const tags = card.querySelector('.tags');
  for (const tag of demo.tags ?? []) {
    const chip = document.createElement('span');
    chip.className = 'tag';
    chip.textContent = tag;
    tags.append(chip);
  }

  const launch = card.querySelector('.launch');
  launch.href = demo.path;
  launch.setAttribute('aria-label', `Open ${demo.title}`);

  const docs = card.querySelector('.docs');
  docs.href = demo.docs;
  if (!demo.docs) docs.hidden = true;

  return card;
}

function renderGallery() {
  const query = normalize(searchInput.value.trim());
  const visible = demos.filter(demo => {
    const tagMatch = activeTag === 'all' || demo.tags?.includes(activeTag);
    const haystack = normalize([
      demo.title,
      demo.summary,
      demo.kind,
      ...(demo.tags ?? []),
      ...Object.values(demo.facts ?? {})
    ].join(' '));
    return tagMatch && (!query || haystack.includes(query));
  });

  gallery.replaceChildren(...visible.map(makeCard));
  empty.hidden = visible.length !== 0;
  summary.textContent = `${visible.length} of ${demos.length} demo${demos.length === 1 ? '' : 's'} shown`;
}

async function init() {
  try {
    const response = await fetch('./demos.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    demos = await response.json();
    count.textContent = demos.length;
    renderFilters();
    renderGallery();
  } catch (error) {
    summary.textContent = 'Gallery manifest failed to load';
    empty.hidden = false;
    empty.textContent = `Could not load demos.json: ${error.message}`;
  }
}

searchInput.addEventListener('input', renderGallery);
init();
