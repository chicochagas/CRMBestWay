import type { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { getServiceContext } from '@/lib/actions/context';
import { todayInSaoPaulo } from '@/lib/dates';
import { countToday } from '@/lib/services/today/getTodayList';

export default async function CrmLayout({ children }: { children: ReactNode }) {
  const ctx = await getServiceContext();
  const todayCount = await countToday(ctx, todayInSaoPaulo());

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar viewer={ctx.viewer} todayCount={todayCount} />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
