import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import React from 'react';
import { ShoppingCartButtonClient } from './ShoppingCartButtonClient';

export default async function ShopingCartButton() {
  const session = await auth();
  let initialCount = 0;

  if (session?.user?.id) {
    initialCount = await prisma.cartItem.count({
      where: { cart: { userId: session.user.id } },
    });
  }

  return <ShoppingCartButtonClient initialCount={initialCount} isAuthenticated={!!session?.user?.id} />;
}
