/**
 * Типы событий для коммуникации компонентов расширения
 * @module events.types
 * @version 1.0.0
 */

/**
 * Базовый интерфейс события
 */
export interface BaseEvent {
  readonly type: string;
  readonly timestamp: Date;
  readonly eventId: string;
  readonly version: number;
  readonly metadata?: EventMetadata;
}

/**
 * Метаданные события
 */
export interface EventMetadata {
  readonly userId?: string;
  readonly sessionId?: string;
  readonly traceId?: string;
  readonly source?: string;
  readonly causationId?: string;
  readonly correlationId?: string;
}

/**
 * Domain Event с типизированными данными
 */
export interface DomainEvent<TData = unknown> extends BaseEvent {
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly data: TData;
}

/**
 * Обработчик событий
 */
export type EventHandler<TData = unknown> = (
  event: DomainEvent<TData>
) => void | Promise<void>;

/**
 * Функция отписки от события
 */
export type UnsubscribeFn = () => void;
