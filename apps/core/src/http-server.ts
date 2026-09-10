import { createServer, type RequestListener, type Server } from 'node:http';

export interface HttpServerOptions {
  host: string;
  port: number;
}

export class HttpServer {
  private readonly server: Server;

  constructor(
    listener: RequestListener,
    private readonly options: HttpServerOptions,
  ) {
    this.server = createServer(listener);
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const handleError = (error: Error) => {
        this.server.off('listening', handleListening);
        reject(error);
      };
      const handleListening = () => {
        this.server.off('error', handleError);
        resolve();
      };

      this.server.once('error', handleError);
      this.server.once('listening', handleListening);
      this.server.listen(this.options.port, this.options.host);
    });
  }

  stop(): Promise<void> {
    if (!this.server.listening) return Promise.resolve();

    return new Promise((resolve, reject) => {
      this.server.close((error) => (error ? reject(error) : resolve()));
    });
  }

  address(): ReturnType<Server['address']> {
    return this.server.address();
  }
}
