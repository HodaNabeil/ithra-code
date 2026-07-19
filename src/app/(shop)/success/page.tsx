'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ORDER_ENDPOINTS } from '@/constants/order';
import { Order } from '@/types/order/order.ui';
import { Link } from '@/components/shared/link';
import { APP_ROUTES } from '@/constants/enums';
import { useRouter } from 'next/navigation';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      const res = await fetch(ORDER_ENDPOINTS.GET_ORDER(orderId));
      const data = await res.json();

      setOrder(data);
      setLoading(false);
      router.refresh();
    };

    fetchOrder();
  }, [orderId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-muted-foreground animate-pulse">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm font-bold uppercase tracking-[0.2em]">
            Preparing Receipt...
          </p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-4 sm:py-20 relative overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 bg-[grid-gray-alpha-100] mask-[radial-gradient(ellipse_at_center,white,transparent)]" />

      <div className="max-w-md w-full bg-card shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] rounded-4xl overflow-hidden border border-border flex flex-col relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Header Section (Fixed) */}
        <div className="bg-linear-to-br from-success to-emerald-600 p-8 flex flex-col items-center justify-center gap-4 text-white text-center shrink-0">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md ring-4 ring-white/10">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight drop-shadow-sm">
              Payment Successful
            </h1>
            <p className="text-white/80 text-sm font-medium mt-1">
              Order confirmed & access granted
            </p>
          </div>
        </div>

        {/* Scrollable Content Section */}
        <div className="flex-1 overflow-y-auto max-h-[60vh] custom-scrollbar">
          <div className="p-6 sm:p-8 space-y-8">
            {/* Order Info */}
            <div>
              <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 text-center">
                Transaction Details
              </h2>
              <div className="grid gap-2">
                <div className="flex justify-between items-center p-3 px-4 rounded-xl bg-muted/10 border border-border/40">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">
                    Reference
                  </span>
                  <span className="font-mono text-[11px] font-black text-foreground">
                    {order.orderNumber?.split('-').pop() || order.id.slice(-10)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 px-4 rounded-xl bg-muted/10 border border-border/40">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">
                    Status
                  </span>
                  <span className="bg-success/20 text-success px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border border-success/30">
                    {order.status}
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 mt-2 border-t border-dashed border-border/60">
                  <span className="text-sm font-black text-foreground">
                    Total Paid
                  </span>
                  <span className="text-xl font-black text-foreground">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: order.currency,
                    }).format(order.totalCents / 100)}
                  </span>
                </div>
              </div>
            </div>

            {/* Courses List */}
            <div>
              <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 text-center">
                Your Access
              </h2>
              <div className="space-y-2">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-muted/5 border border-border hover:border-success/40 transition-all group"
                  >
                    <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center text-success font-black text-lg shadow-inner">
                      {item.course.title[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-foreground truncate">
                        {item.course.title}
                      </h3>
                      <p className="text-[10px] font-bold text-success mt-0.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                        Ready to Start
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-8 pt-0 mt-auto">
          <Link
            href={APP_ROUTES.MY_COURSES}
            className="w-full h-14 flex items-center justify-center bg-primary text-primary-foreground rounded-xl font-black text-xl hover:opacity-90 transition-all shadow-lg shadow-primary/10 active:scale-95"
          >
            Start Learning
          </Link>
          <p className="text-center text-[10px] font-bold text-muted-foreground mt-4 opacity-60">
            A copy of the receipt has been sent to your email.
          </p>
        </div>
      </div>
    </div>
  );
}
