import WebSocket from 'ws';
import type {
  AuthenticatePayload,
  AuthenticatedPayload,
  AuthErrorPayload,
  StatusReportPayload,
  SpendApprovedPayload,
  SpendDeniedPayload,
} from '@stamn/types';
import type { Logger } from 'pino';
import type { AgentConfig } from '../config/config-schema.js';
import { Heartbeat, type HeartbeatSender } from './heartbeat.js';
import { MessageHandler } from './message-handler.js';

export type SpendResultCallback = (
  type: 'approved' | 'denied',
  payload: SpendApprovedPayload | SpendDeniedPayload,
) => void;

export interface WSClientOptions {
  config: AgentConfig;
  logger: Logger;
  onCommand: (command: string, params?: Record<string, unknown>) => void;
  onDisconnect: () => void;
  onConnected: () => void;
}

export class WSClient implements HeartbeatSender {
  private ws: WebSocket | null = null;
  private heartbeat: Heartbeat | null = null;
  private handler: MessageHandler;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isShuttingDown = false;
  private authenticated = false;
  private readonly startTime = Date.now();
  private spendListeners = new Map<string, SpendResultCallback>();

  constructor(private options: WSClientOptions) {
    this.handler = new MessageHandler(options.logger, options.onCommand);
  }

  onSpendResult(requestId: string, callback: SpendResultCallback): void {
    this.spendListeners.set(requestId, callback);
  }

  removeSpendListener(requestId: string): void {
    this.spendListeners.delete(requestId);
  }

  connect(): void {
    if (this.isShuttingDown) return;

    const config = this.options.config;
    const wsUrl = config.serverUrl
      .replace(/^http:/, 'ws:')
      .replace(/^https:/, 'wss:');
    const url = `${wsUrl}/ws/agent`;

    this.options.logger.info({ url }, 'Connecting to server...');

    this.ws = new WebSocket(url);

    this.ws.on('open', () => {
      this.options.logger.info('WebSocket connected, authenticating...');
      this.reconnectAttempt = 0;

      const payload: AuthenticatePayload = {
        agentId: config.agentId!,
        apiKey: config.apiKey ?? '',
      };

      this.send('agent:authenticate', payload);
    });

    this.ws.on('message', (data: WebSocket.RawData) => {
      const raw = data.toString();
      const result = this.handler.handle(raw);
      if (!result) return;

      switch (result.type) {
        case 'server:authenticated': {
          const payload = result.payload as AuthenticatedPayload;
          this.authenticated = true;
          this.options.logger.info(
            { serverVersion: payload.serverVersion },
            `Agent ${payload.agentId} authenticated`,
          );

          this.heartbeat = new Heartbeat(
            this,
            config.agentId!,
            config.heartbeatIntervalMs,
            this.startTime,
          );
          this.heartbeat.start();

          this.sendStatusReport('online');
          this.options.onConnected();
          break;
        }

        case 'server:auth_error': {
          const payload = result.payload as AuthErrorPayload;
          this.options.logger.error(
            { reason: payload.reason },
            'Authentication failed',
          );
          this.isShuttingDown = true;
          this.ws?.close(4003, 'Auth failed');
          break;
        }

        case 'server:heartbeat_ack':
          this.heartbeat?.onAck();
          break;

        case 'server:spend_approved': {
          const sp = result.payload as SpendApprovedPayload;
          const cb = this.spendListeners.get(sp.requestId);
          if (cb) {
            cb('approved', sp);
            this.spendListeners.delete(sp.requestId);
          }
          break;
        }

        case 'server:spend_denied': {
          const sd = result.payload as SpendDeniedPayload;
          const dcb = this.spendListeners.get(sd.requestId);
          if (dcb) {
            dcb('denied', sd);
            this.spendListeners.delete(sd.requestId);
          }
          break;
        }

        case 'server:event':
          this.options.logger.debug({ event: result.payload }, 'Server event');
          break;

        case 'server:command':
          // Already handled by MessageHandler → onCommand callback
          break;
      }
    });

    this.ws.on('close', (code: number, reason: Buffer) => {
      this.authenticated = false;
      this.heartbeat?.stop();
      this.heartbeat = null;

      if (this.isShuttingDown) {
        this.options.logger.info('Connection closed');
        return;
      }

      this.options.logger.warn(
        { code, reason: reason.toString() },
        'Connection lost',
      );
      this.options.onDisconnect();
      this.scheduleReconnect();
    });

    this.ws.on('error', (err: Error) => {
      this.options.logger.error({ err: err.message }, 'WebSocket error');
    });
  }

  reconnect(): void {
    this.heartbeat?.stop();
    this.heartbeat = null;
    this.ws?.close();
  }

  send<T>(type: string, payload: T): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;

    // NestJS @SubscribeMessage expects {event, data} format
    this.ws.send(JSON.stringify({ event: type, data: payload }));
  }

  disconnect(): void {
    this.isShuttingDown = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.authenticated) {
      this.sendStatusReport('shutting_down');
    }

    this.heartbeat?.stop();
    this.ws?.close(1000, 'Client shutdown');
  }

  get isAuthenticated(): boolean {
    return this.authenticated;
  }

  private sendStatusReport(status: StatusReportPayload['status']): void {
    const payload: StatusReportPayload = {
      agentId: this.options.config.agentId!,
      status,
      version: '0.0.0',
    };
    this.send('agent:status_report', payload);
  }

  private scheduleReconnect(): void {
    const { wsReconnectBaseMs, wsReconnectMaxMs } = this.options.config;
    const delay = Math.min(
      wsReconnectBaseMs * 2 ** this.reconnectAttempt,
      wsReconnectMaxMs,
    );
    const jitter = Math.random() * delay * 0.1;
    const totalDelay = Math.round(delay + jitter);

    this.reconnectAttempt++;
    this.options.logger.info(
      { attempt: this.reconnectAttempt, delayMs: totalDelay },
      'Reconnecting...',
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, totalDelay);
  }
}
