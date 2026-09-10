import type { Message } from '@msgdock/contracts';

export interface MessageCreatedEvent {
  type: 'message.created';
  message: Message;
  occurredAt: string;
}

export type MessageEvent = MessageCreatedEvent;
export type MessageEventType = MessageEvent['type'];

export type MessageEventHandler<T extends MessageEventType> = (
  event: Extract<MessageEvent, { type: T }>,
) => void | Promise<void>;

export interface EventBus {
  publish(event: MessageEvent): Promise<void>;
  subscribe<T extends MessageEventType>(
    type: T,
    handler: MessageEventHandler<T>,
  ): () => void;
}

export class InProcessEventBus implements EventBus {
  private readonly handlers = new Map<
    MessageEventType,
    Set<MessageEventHandler<MessageEventType>>
  >();

  async publish(event: MessageEvent): Promise<void> {
    const handlers = this.handlers.get(event.type);

    if (!handlers) return;

    await Promise.all(
      [...handlers].map((handler) =>
        Promise.resolve(handler(event as unknown as never)),
      ),
    );
  }

  subscribe<T extends MessageEventType>(
    type: T,
    handler: MessageEventHandler<T>,
  ): () => void {
    const handlers =
      this.handlers.get(type) ??
      new Set<MessageEventHandler<MessageEventType>>();

    handlers.add(handler as unknown as MessageEventHandler<MessageEventType>);
    this.handlers.set(type, handlers);

    return () => {
      handlers.delete(
        handler as unknown as MessageEventHandler<MessageEventType>,
      );

      if (handlers.size === 0) this.handlers.delete(type);
    };
  }
}
