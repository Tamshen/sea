export interface NavItem {
  name: string;
  url: string;
  desc?: string;
}

export interface NavGroup {
  name: string;
  items: NavItem[];
}

export const navData: NavGroup[] = [
  {
    name: '常用工具',
    items: [
      { name: '百度', url: 'https://www.baidu.com', desc: '搜索引擎' },
      { name: '谷歌', url: 'https://www.google.com', desc: '搜索引擎' },
      { name: 'GitHub', url: 'https://github.com', desc: '代码托管' },
      { name: 'Stack Overflow', url: 'https://stackoverflow.com', desc: '技术问答' },
    ],
  },
  {
    name: '开发文档',
    items: [
      { name: 'MDN', url: 'https://developer.mozilla.org', desc: 'Web 文档' },
      { name: 'Tailwind CSS', url: 'https://tailwindcss.com', desc: 'CSS 框架' },
      { name: 'TypeScript', url: 'https://www.typescriptlang.org', desc: '类型语言' },
      { name: 'Node.js', url: 'https://nodejs.org', desc: '运行时' },
    ],
  },
];

export interface ConfigEngine {
  name: string;
  des: string;
  url: string;
  order: number;
}

export interface AppConfig {
  engine: ConfigEngine[];
  new_tab: boolean;
  title: string;
  bg: string;
  customCss?: string;
  show_line_animation?: boolean;
  remember_engine?: boolean;
  show_poem?: boolean;
}

export const defaultConfig: AppConfig = {
  engine: [
    { name: 'Bing', des: '必应搜索', url: 'https://www.bing.com/search?q=%s', order: 100 },
    { name: '360', des: '360搜索', url: 'https://www.so.com/s?q=%s', order: 4 },
    { name: 'SouGou', des: '搜狗搜索', url: 'https://www.sogou.com/web?query=%s', order: 3 },
    { name: 'Google', des: '谷歌搜索', url: 'https://www.google.com/search?q=%s', order: 2 },
    { name: 'Baidu', des: '百度搜索', url: 'https://www.baidu.com/s?wd=%s', order: 1 },
  ],
  new_tab: true,
  title: 'New Tab',
  bg: '',
  customCss: '',
  show_line_animation: true,
  remember_engine: false,
  show_poem: true,
};

const CONFIG_KEY = 'legendink_config';

export function loadConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppConfig>;
      const merged = { ...defaultConfig, ...parsed };
      // 确保 boolean 字段有正确默认值
      merged.show_poem = merged.show_poem !== false;
      merged.show_line_animation = merged.show_line_animation !== false;
      merged.remember_engine = !!merged.remember_engine;
      merged.new_tab = merged.new_tab !== false;
      // 兼容旧数据：没有 order 的自动补上
      merged.engine = merged.engine.map((e, i) => ({
        ...e,
        order: typeof e.order === 'number' ? e.order : i + 1,
      }));
      // 按 order 降序排列（越大越靠前）
      merged.engine.sort((a, b) => b.order - a.order);
      return merged;
    }
  } catch {
    // ignore
  }
  return { ...defaultConfig };
}

export function saveConfig(config: AppConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function engineToSelectOptions(engines: ConfigEngine[]) {
  return engines.map((e) => ({
    key: e.name,
    name: e.name,
    url: e.url,
  }));
}

export function buildSearchUrl(urlTemplate: string, query: string): string {
  return urlTemplate.replace('%s', encodeURIComponent(query));
}

// 搜索历史记录
const HISTORY_KEY = 'legendink_history';
const MAX_HISTORY = 10;

export function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveHistory(history: string[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

export function addHistory(query: string): void {
  const text = query.trim();
  if (!text) return;
  const list = loadHistory();
  const filtered = list.filter((item) => item !== text);
  filtered.unshift(text);
  saveHistory(filtered);
}

export function removeHistory(query: string): void {
  const list = loadHistory();
  const filtered = list.filter((item) => item !== query);
  saveHistory(filtered);
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

// 快速链接分类
const QUICK_LINK_CATEGORIES_KEY = 'legendink_quicklink_categories';

export interface QuickLinkCategory {
  id: string;
  name: string;
  order: number;
}

export const defaultCategories: QuickLinkCategory[] = [
  { id: 'ai', name: 'AI', order: 100 },
  { id: 'default', name: '默认', order: 1 },
];

export const defaultQuickLinks: QuickLink[] = [
  {
    id: 'deepseek',
    title: 'DeepSeek',
    url: 'https://chat.deepseek.com',
    desc: '深度求索 AI 对话',
    icon: 'carbon:machine-learning',
    newTab: true,
    categoryId: 'ai',
  },
  {
    id: 'doubao',
    title: '豆包',
    url: 'https://www.doubao.com',
    desc: '字节跳动 AI 助手',
    icon: 'carbon:chat',
    newTab: true,
    categoryId: 'ai',
  },
  {
    id: 'qwen',
    title: '通义千问',
    url: 'https://www.qianwen.com',
    desc: '阿里云大模型',
    icon: 'carbon:cloud',
    newTab: true,
    categoryId: 'ai',
  },
  {
    id: 'chatgpt',
    title: 'ChatGPT',
    url: 'https://chat.openai.com',
    desc: 'OpenAI 对话模型',
    icon: 'carbon:bot',
    newTab: true,
    categoryId: 'ai',
  },
  {
    id: 'kimi',
    title: 'Kimi',
    url: 'https://www.kimi.com/',
    desc: '月之暗面 AI',
    icon: 'carbon:moon',
    newTab: true,
    categoryId: 'ai',
  },
  {
    id: 'gemini',
    title: 'Gemini',
    url: 'https://gemini.google.com',
    desc: 'Google AI 助手',
    icon: 'carbon:logo-google',
    newTab: true,
    categoryId: 'ai',
  },
  {
    id: 'claude',
    title: 'Claude',
    url: 'https://claude.ai/new',
    desc: 'Anthropic Claude',
    icon: 'carbon:bot',
    newTab: true,
    categoryId: 'ai',
  },
];

export function loadCategories(): QuickLinkCategory[] {
  try {
    const raw = localStorage.getItem(QUICK_LINK_CATEGORIES_KEY);
    if (raw) {
      const list = JSON.parse(raw) as QuickLinkCategory[];
      return list.sort((a, b) => b.order - a.order);
    }
  } catch {
    // ignore
  }
  return JSON.parse(JSON.stringify(defaultCategories));
}

export function saveCategories(categories: QuickLinkCategory[]): void {
  localStorage.setItem(QUICK_LINK_CATEGORIES_KEY, JSON.stringify(categories));
}

// 快速链接
const QUICK_LINKS_KEY = 'legendink_quicklinks';

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  desc?: string;
  icon?: string;
  newTab?: boolean;
  categoryId?: string;
}

export function loadQuickLinks(): QuickLink[] {
  try {
    const raw = localStorage.getItem(QUICK_LINKS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return JSON.parse(JSON.stringify(defaultQuickLinks));
}

export function saveQuickLinks(links: QuickLink[]): void {
  localStorage.setItem(QUICK_LINKS_KEY, JSON.stringify(links));
}

export function addQuickLink(link: QuickLink): void {
  const list = loadQuickLinks();
  list.push(link);
  saveQuickLinks(list);
}

export function updateQuickLink(link: QuickLink): void {
  const list = loadQuickLinks();
  const index = list.findIndex((l) => l.id === link.id);
  if (index >= 0) {
    list[index] = link;
    saveQuickLinks(list);
  }
}

export function removeQuickLink(id: string): void {
  const list = loadQuickLinks();
  const filtered = list.filter((l) => l.id !== id);
  saveQuickLinks(filtered);
}
