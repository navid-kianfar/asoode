import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent } from '@asoode/shared';

export const DOMAIN_EVENT = 'domain.event';

@Injectable()
export class DomainEventService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Emit a domain event. This is non-blocking — the event is processed
   * asynchronously by DomainEventListener which handles:
   * 1. Socket notification (via RabbitMQ socket queue)
   * 2. Push notification (via RabbitMQ push queue)
   * 3. Activity logging (via RabbitMQ activity queue → Worker)
   */
  emit(event: DomainEvent): void {
    this.eventEmitter.emit(DOMAIN_EVENT, event);
  }
}
