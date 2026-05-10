import { navData } from './nav-data';
import type { NavGroup, NavItem } from './nav-data';

export function initApp(): void {
  const app = document.getElementById('app');
  if (!app) return;

  const nav = createNav();
  app.appendChild(nav);
}

function createNav(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'min-h-screen bg-gray-50';

  const header = document.createElement('header');
  header.className = 'bg-white shadow';
  const title = document.createElement('h1');
  title.className = 'text-xl font-bold text-gray-800 p-4';
  title.textContent = 'LegendInk 导航';
  header.appendChild(title);
  container.appendChild(header);

  const main = document.createElement('main');
  main.className = 'p-4';

  for (let i = 0; i < navData.length; i++) {
    const group = navData[i];
    const section = createGroup(group);
    main.appendChild(section);
  }

  container.appendChild(main);
  return container;
}

function createGroup(group: NavGroup): HTMLElement {
  const section = document.createElement('section');
  section.className = 'mb-6';

  const h2 = document.createElement('h2');
  h2.className = 'text-lg font-semibold text-gray-700 mb-3';
  h2.textContent = group.name;
  section.appendChild(h2);

  const list = document.createElement('div');

  for (let i = 0; i < group.items.length; i++) {
    const item = group.items[i];
    const card = createCard(item);
    list.appendChild(card);
  }

  section.appendChild(list);
  return section;
}

function createCard(item: NavItem): HTMLElement {
  const a = document.createElement('a');
  a.href = item.url;
  a.className = 'inline-block w-1/4 p-2 align-top';
  a.target = '_blank';

  const inner = document.createElement('div');
  inner.className = 'block p-3 bg-white rounded shadow hover:shadow-md';

  const name = document.createElement('div');
  name.className = 'font-medium text-gray-800';
  name.textContent = item.name;
  inner.appendChild(name);

  if (item.desc) {
    const desc = document.createElement('div');
    desc.className = 'text-sm text-gray-500 mt-1';
    desc.textContent = item.desc;
    inner.appendChild(desc);
  }

  a.appendChild(inner);
  return a;
}
