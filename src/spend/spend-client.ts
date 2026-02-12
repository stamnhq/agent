import { randomUUID } from 'crypto';
import type { Logger } from 'pino';
import type {
  SpendRequestPayload,
  SpendApprovedPayload,
  SpendDeniedPayload,
  LedgerCategory,
  LedgerRail,
} from '@stamn/types';
import type { WSClient } from '../ws/ws-client.js';

export type SpendResult =
  | {
      approved: true;
      ledgerEntryId: string;
      transactionHash?: string;
      remainingBalanceCents: number;
    }
  | { approved: false; reason: string; code: string };

export interface SpendParams {
  amountCents: number;
  category: LedgerCategory;
  rail: LedgerRail;
  vendor?: string;
  description: string;
  recipientAgentId?: string;
  recipientAddress?: string;
}

const SPEND_TIMEOUT_MS = 30_000;

export class SpendClient {
  constructor(
    private wsClient: WSClient,
    private logger: Logger,
  ) {}

  async request(params: SpendParams): Promise<SpendResult> {
    const requestId = randomUUID();

    const payload: SpendRequestPayload = {
      requestId,
      amountCents: params.amountCents,
      currency: 'USDC',
      category: params.category,
      rail: params.rail,
      vendor: params.vendor,
      description: params.description,
      recipientAgentId: params.recipientAgentId,
      recipientAddress: params.recipientAddress,
    };

    this.logger.info(
      {
        requestId,
        amountCents: params.amountCents,
        vendor: params.vendor,
        category: params.category,
      },
      `Requesting spend: ${params.description}`,
    );

    return new Promise<SpendResult>((resolve) => {
      const timeout = setTimeout(() => {
        this.wsClient.removeSpendListener(requestId);
        this.logger.error({ requestId }, 'Spend request timed out');
        resolve({
          approved: false,
          reason: 'Request timed out',
          code: 'timeout',
        });
      }, SPEND_TIMEOUT_MS);

      this.wsClient.onSpendResult(requestId, (type, result) => {
        clearTimeout(timeout);

        if (type === 'approved') {
          const approved = result as SpendApprovedPayload;
          this.logger.info(
            {
              requestId,
              ledgerEntryId: approved.ledgerEntryId,
              remainingBalanceCents: approved.remainingBalanceCents,
            },
            'Spend approved',
          );
          resolve({
            approved: true,
            ledgerEntryId: approved.ledgerEntryId,
            transactionHash: approved.transactionHash,
            remainingBalanceCents: approved.remainingBalanceCents,
          });
        } else {
          const denied = result as SpendDeniedPayload;
          this.logger.warn(
            { requestId, code: denied.code, reason: denied.reason },
            'Spend denied',
          );
          resolve({
            approved: false,
            reason: denied.reason,
            code: denied.code,
          });
        }
      });

      this.wsClient.send('agent:spend_request', payload);
    });
  }
}
