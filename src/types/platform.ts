/**
 * Информация о платформе
 */
export interface PlatformInfo {
  name: string;
  domain: string;
  baseUrl: string;
  version: string;
  description?: string;
  tags?: string[];
  logo?: string;
  features?: PlatformFeature[];
}

/**
 * Особенности платформы
 */
export type PlatformFeature = 
  | 'multi_translator'   // несколько переводчиков
  | 'detailed_ratings'   // детальные рейтинги
  | 'user_bookmarks'     // пользовательские закладки
  | 'season_structure'   // структура сезонов/томов
  | 'team_based'         // организовано по командам
  | 'real_time_updates'  // обновления в реальном времени
  | 'advanced_search'    // продвинутый поиск
  | 'cdn_images';        // CDN для изображений

/**
 * URL паттерны платформы
 */
export interface PlatformUrls {
  workDetail: string;       // /{slug} или /work/{id}
  workList: string;         // /list или /browse
  chapterList: string;      // /{slug}/chapters
  chapterRead: string;      // /{slug}/{chapter}
  teamProfile?: string;     // /team/{id}
  userProfile?: string;     // /user/{id}
  search?: string;          // /search?q={query}
}

/**
 * Конфигурация платформы
 */
export interface PlatformConfig {
  info: PlatformInfo;
  urls: PlatformUrls;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  rateLimit?: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  proxy?: {
    enabled: boolean;
    url?: string;
    auth?: {
      username: string;
      password: string;
    };
  };
}
