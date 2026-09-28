export interface Protocol {
  readonly name: string;

  start(): Promise<void>;

  stop(): Promise<void>;
}
