/**
 * URL Pattern Matcher - умное определение паттернов URL
 * @module utils/url-pattern-matcher
 * @version 1.0.0
 */

/**
 * Определить паттерн из конкретного URL
 * 
 * Примеры преобразований:
 * - site.com/manga/some-title/chapters -> /manga/star/chapters (star = wildcard)
 * - site.com/read/123/page/5 -> /read/star/page/star
 * - site.com/author/john-doe -> /author/star
 */
export function extractPattern(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    const segments = pathname.split('/').filter(s => s.length > 0);
    
    if (segments.length === 0) {
      return '/';
    }

    const pattern = segments.map((segment, index) => {
      // Первый и последний сегменты обычно статические
      if (index === 0 || index === segments.length - 1) {
        return segment;
      }

      // Средние сегменты с дефисами или цифрами - параметры
      if (segment.includes('-') || /^\d+$/.test(segment)) {
        return '*';
      }

      return segment;
    });

    return '/' + pattern.join('/');
  } catch (error) {
    console.error('Error extracting pattern:', error);
    return '/';
  }
}

/**
 * Проверить, соответствует ли URL паттерну
 * 
 * Поддерживает:
 * - Простые wildcards: /manga/star/chapters (star = wildcard)
 * - Множественные wildcards: /read/star/page/star
 * - Regex: начинается с ^
 */
export function matchesPattern(url: string, pattern: string): boolean {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Если паттерн начинается с ^ - это regex
    if (pattern.startsWith('^') || pattern.startsWith('/^')) {
      const regex = new RegExp(pattern);
      return regex.test(pathname);
    }

    // Преобразуем паттерн в regex
    // /manga/star/chapters -> ^/manga/[^/]+/chapters$
    const regexPattern = '^' + pattern
      .split('/')
      .map(segment => {
        if (segment === '*') {
          return '[^/]+'; // Любые символы кроме /
        }
        return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Экранируем
      })
      .join('/') + '$';

    const regex = new RegExp(regexPattern);
    return regex.test(pathname);
  } catch (error) {
    console.error('Error matching pattern:', error);
    return false;
  }
}

/**
 * Предложить варианты паттернов для URL
 */
export function suggestPatterns(url: string): string[] {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const segments = pathname.split('/').filter(s => s.length > 0);

    const suggestions: string[] = [];

    // Вариант 1: Полный путь
    suggestions.push(pathname);

    // Вариант 2: С wildcards для динамических частей
    if (segments.length > 0) {
      const withWildcards = segments.map((segment, index) => {
        // Сегменты с дефисами, цифрами или длинные - параметры
        if (
          segment.includes('-') || 
          /^\d+$/.test(segment) || 
          segment.length > 20 ||
          (index > 0 && index < segments.length - 1)
        ) {
          return '*';
        }
        return segment;
      });
      suggestions.push('/' + withWildcards.join('/'));
    }

    // Вариант 3: Только первый и последний сегмент
    if (segments.length >= 3) {
      const firstLast = [segments[0], ...Array(segments.length - 2).fill('*'), segments[segments.length - 1]];
      suggestions.push('/' + firstLast.join('/'));
    }

    // Вариант 4: Только первый сегмент
    if (segments.length >= 2) {
      suggestions.push('/' + segments[0] + '/*');
    }

    // Убираем дубликаты
    return [...new Set(suggestions)];
  } catch (error) {
    console.error('Error suggesting patterns:', error);
    return ['/'];
  }
}

/**
 * Получить описание паттерна
 */
export function describePattern(pattern: string): string {
  const wildcardCount = (pattern.match(/\*/g) || []).length;
  
  if (wildcardCount === 0) {
    return 'Exact path match';
  }
  
  if (pattern.startsWith('^')) {
    return 'Custom regex pattern';
  }

  const segments = pattern.split('/').filter(s => s.length > 0);
  const staticSegments = segments.filter(s => s !== '*');
  
  return `Matches ${staticSegments.join(' / ')} with ${wildcardCount} dynamic part(s)`;
}
