import 'dotenv/config';
import { createReconcilePaymentsUseCase } from '@/features/payments/infrastructure/di/payments.container';

async function main(): Promise<void> {
  const useCase = createReconcilePaymentsUseCase();
  const summary = await useCase.execute();
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
