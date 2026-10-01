import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-card border border-border bg-card p-8 shadow-sm">
        <p className="mb-6 text-sm font-semibold tracking-wide">
          Red<span className="text-brand">Rex</span> · CRM
        </p>
        {children}
      </div>
    </main>
  );
}
