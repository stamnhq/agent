export interface OpenClawClient {
  injectEvent(message: string): Promise<void>;
}
