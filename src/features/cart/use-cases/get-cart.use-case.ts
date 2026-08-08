import type { CartDataType } from '@/types/cart/cart';
import { getCartForUser } from '../services/cart.service';
import type { CartRepository } from '../domain/repositories/cart.repository';
import { cartRepository } from '../infrastructure/prisma/repositories/prisma-cart.repository';

export type GetCartUseCaseDeps = {
  repository?: CartRepository;
};

export async function getCartUseCase(
  userId: string,
  deps: GetCartUseCaseDeps = {},
): Promise<CartDataType> {
  return getCartForUser(userId, deps.repository ?? cartRepository);
}
