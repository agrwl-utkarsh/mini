export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function formatPercentage(num: number): string {
  return num.toFixed(1) + '%';
}

export function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    Python: '#3776ab',
    JavaScript: '#f7df1e',
    TypeScript: '#3178c6',
    React: '#61dafb',
    Java: '#ed8b00',
    Go: '#00add8',
    Rust: '#dea584',
    'C++': '#00599c',
    C: '#a8b9cc',
    'C#': '#239120',
    PHP: '#777bb4',
    Ruby: '#cc342d',
    Swift: '#fa7343',
    Kotlin: '#7f52ff',
    Scala: '#dc322f',
    HTML: '#e34f26',
    CSS: '#1572b6',
    SCSS: '#cf649a',
    JSON: '#292929',
    YAML: '#cb171e',
    TOML: '#9c4121',
    Markdown: '#083fa1',
    Shell: '#89e051',
    Dockerfile: '#2496ed',
    SQL: '#e38c00',
  };
  return colors[language] || '#64748b';
}

export function getLanguageIcon(language: string): string {
  const icons: Record<string, string> = {
    Python: '🐍',
    JavaScript: '📜',
    TypeScript: '📘',
    React: '⚛️',
    Java: '☕',
    Go: '🐹',
    Rust: '🦀',
    'C++': '⚙️',
    C: '⚙️',
    'C#': '🔷',
    PHP: '🐘',
    Ruby: '💎',
    Swift: '🕊️',
    Kotlin: '🅺',
    Scala: '🔴',
    HTML: '🌐',
    CSS: '🎨',
    SCSS: '🎨',
    JSON: '📋',
    YAML: '📄',
    TOML: '📄',
    Markdown: '📝',
    Shell: '🐚',
    Dockerfile: '🐳',
    SQL: '🗄️',
  };
  return icons[language] || '📄';
}

export function truncatePath(path: string, maxLength: number = 50): string {
  if (path.length <= maxLength) return path;
  const parts = path.split('/');
  if (parts.length <= 2) return path;
  return '.../' + parts.slice(-2).join('/');
}

export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

export function isImageFile(filename: string): boolean {
  const ext = getFileExtension(filename).toLowerCase();
  return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext);
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}