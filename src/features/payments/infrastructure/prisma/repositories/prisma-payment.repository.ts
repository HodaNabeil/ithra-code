import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import {
  FULFILLABLE_PAYMENT_STATUSES,
  type PaymentEntity,
} from '@/features/payments/domain';
import type {
  ClaimDuePaymentsInput,
  FindStalePaymentsInput,
  MarkPaymentFailedInput,
  MarkPaymentSucceededInput,
  PaymentRepository,
  RecordReconcileAttemptInput,
  SchedulePaymentReconcileInput,
  DuePaymentRecord,
} from '@/features/payments/application/ports';
import { PaymentMapper } from '../mappers/payment.mapper';
import type { PrismaClientLike } from '../prisma.types';

type ClaimedRow = {
  id: string;
  order_id: string;
  provider_session_id: string | null;
  session_expires_at: Date | null;
};

const DEFAULT_CLAIM_LEASE_MS = 5 * 60 * 1000;

/**
 * Prisma-backed implementation of the Payment persistence port.
 * Manages the Payment aggregate only.
 */
export class PrismaPaymentRepository implements PaymentRepository {
  constructor(private readonly db: PrismaClientLike = prisma) {}

  async save(payment: PaymentEntity): Promise<PaymentEntity> {
    const created = await this.db.payment.create({
      data: PaymentMapper.toCreateInput(payment),
    });

    return PaymentMapper.toDomain(created);
  }

  async findById(paymentId: string): Promise<PaymentEntity | null> {
    const payment = await this.db.payment.findUnique({
      where: { id: paymentId },
    });

    return payment ? PaymentMapper.toDomain(payment) : null;
  }

  async markProcessing(paymentId: string): Promise<void> {
    await this.db.payment.update({
      where: { id: paymentId },
      data: { status: 'PROCESSING' },
    });
  }

  async markProcessingAndScheduleReconcile(
    paymentId: string,
    firstReconcileAt: Date,
  ): Promise<void> {
    await this.db.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PROCESSING',
        reconcileStatus: 'SCHEDULED',
        nextReconcileAt: firstReconcileAt,
      },
    });
  }

  async markSucceeded(input: MarkPaymentSucceededInput): Promise<boolean> {
    const result = await this.db.payment.updateMany({
      where: {
        id: input.paymentId,
        status: { in: [...FULFILLABLE_PAYMENT_STATUSES] },
      },
      data: {
        status: 'SUCCEEDED',
        providerTransactionId: input.providerTransactionId,
        paidAt: new Date(),
        failureCode: null,
        failureMessage: null,
        reconcileStatus: 'IDLE',
        nextReconcileAt: null,
        ...(input.paymentMethod !== undefined
          ? { paymentMethod: input.paymentMethod }
          : {}),
        ...(input.last4 !== undefined ? { last4: input.last4 } : {}),
        ...(input.brand !== undefined ? { brand: input.brand } : {}),
        ...(input.integrationId !== undefined
          ? { integrationId: input.integrationId }
          : {}),
        ...(input.providerMetadata != null
          ? {
              providerMetadata: input.providerMetadata as Prisma.InputJsonValue,
            }
          : {}),
      },
    });

    return result.count > 0;
  }

  async markFailed(input: MarkPaymentFailedInput): Promise<boolean> {
    const result = await this.db.payment.updateMany({
      where: {
        id: input.paymentId,
        status: { in: [...FULFILLABLE_PAYMENT_STATUSES] },
      },
      data: {
        status: 'FAILED',
        reconcileStatus: 'IDLE',
        nextReconcileAt: null,
        ...(input.providerTransactionId !== undefined
          ? { providerTransactionId: input.providerTransactionId }
          : {}),
        failureCode: input.failureCode ?? null,
        failureMessage: input.failureMessage ?? null,
        ...(input.providerMetadata != null
          ? {
              providerMetadata: input.providerMetadata as Prisma.InputJsonValue,
            }
          : {}),
      },
    });

    return result.count > 0;
  }

  async findStaleForReconciliation(
    input: FindStalePaymentsInput,
  ): Promise<DuePaymentRecord[]> {
    return this.claimDueForReconciliation(input);
  }

  async claimDueForReconciliation(
    input: ClaimDuePaymentsInput,
  ): Promise<DuePaymentRecord[]> {
    const leaseMs = input.claimLeaseMs ?? DEFAULT_CLAIM_LEASE_MS;
    const leaseUntil = new Date(Date.now() + leaseMs);
    const statusList = Prisma.join(
      input.statuses.map((status) => Prisma.sql`${status}`),
    );

    return this.db.$transaction(async (tx) => {
      const claimed = await tx.$queryRaw<ClaimedRow[]>`
        WITH due AS (
          SELECT
            p.id,
            o.id AS order_id,
            cs.provider_session_id,
            cs.expires_at AS session_expires_at
          FROM payments p
          INNER JOIN orders o ON o.payment_id = p.id
          LEFT JOIN LATERAL (
            SELECT provider_session_id, expires_at
            FROM checkout_sessions
            WHERE order_id = o.id
            ORDER BY created_at DESC
            LIMIT 1
          ) cs ON TRUE
          WHERE p.status::text IN (${statusList})
            AND p.reconcile_status IN ('IDLE', 'SCHEDULED')
            AND (
              p.next_reconcile_at <= NOW()
              OR (p.next_reconcile_at IS NULL AND p.updated_at < ${input.olderThan})
            )
            AND (
              p.reconcile_lease_expires_at IS NULL
              OR p.reconcile_lease_expires_at < NOW()
            )
          ORDER BY COALESCE(p.next_reconcile_at, p.updated_at) ASC
          LIMIT ${input.limit}
          FOR UPDATE OF p SKIP LOCKED
        )
        UPDATE payments p
        SET
          reconcile_lease_expires_at = ${leaseUntil},
          reconcile_status = 'SCHEDULED',
          updated_at = NOW()
        FROM due
        WHERE p.id = due.id
        RETURNING
          p.id,
          due.order_id,
          due.provider_session_id,
          due.session_expires_at
      `;

      if (claimed.length === 0) {
        return [];
      }

      const payments = await tx.payment.findMany({
        where: { id: { in: claimed.map((row) => row.id) } },
      });

      const byId = new Map(payments.map((p) => [p.id, p]));

      return claimed.flatMap((row) => {
        const payment = byId.get(row.id);
        if (!payment || !row.order_id) {
          return [];
        }
        return [
          {
            payment: PaymentMapper.toDomain(payment),
            orderId: row.order_id,
            providerSessionId: row.provider_session_id,
            sessionExpiresAt: row.session_expires_at,
          },
        ];
      });
    });
  }

  async findReconciliationContext(
    paymentId: string,
  ): Promise<DuePaymentRecord | null> {
    const payment = await this.db.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: {
            checkoutSessions: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!payment?.order) {
      return null;
    }

    const session = payment.order.checkoutSessions[0] ?? null;

    return {
      payment: PaymentMapper.toDomain(payment),
      orderId: payment.order.id,
      providerSessionId: session?.providerSessionId ?? null,
      sessionExpiresAt: session?.expiresAt ?? null,
    };
  }

  async recordReconcileAttempt(
    input: RecordReconcileAttemptInput,
  ): Promise<void> {
    await this.db.$transaction([
      this.db.paymentReconcileAttempt.create({
        data: {
          id: randomUUID(),
          paymentId: input.paymentId,
          attempt: input.attempt,
          outcome: input.outcome,
          decision: input.decision,
          httpStatus: input.httpStatus ?? null,
          detail: input.detail ?? null,
          latencyMs: input.latencyMs ?? null,
          correlationId: input.correlationId ?? null,
        },
      }),
      this.db.payment.update({
        where: { id: input.paymentId },
        data: {
          reconcileAttemptCount: input.attempt,
          consecutiveNotFoundCount: input.consecutiveNotFoundCount,
          reconcileStatus: input.reconcileStatus,
          nextReconcileAt: input.nextReconcileAt,
          reconcileLeaseExpiresAt: null,
          lastReconciledAt: new Date(),
          lastProviderOutcome: input.lastProviderOutcome,
          lastProviderDetail: input.lastProviderDetail,
        },
      }),
    ]);
  }

  async scheduleReconcile(input: SchedulePaymentReconcileInput): Promise<void> {
    await this.db.payment.update({
      where: { id: input.paymentId },
      data: {
        nextReconcileAt: input.nextReconcileAt,
        reconcileStatus: input.reconcileStatus ?? 'SCHEDULED',
      },
    });
  }
}

export const prismaPaymentRepository = new PrismaPaymentRepository();
