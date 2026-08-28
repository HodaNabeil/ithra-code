import type { ReactNode } from 'react';

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full flex-1 bg-student-background">{children}</div>
  );
}
