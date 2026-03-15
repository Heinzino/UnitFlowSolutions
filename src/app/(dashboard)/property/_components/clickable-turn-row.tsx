'use client';

import { useRouter } from 'next/navigation';
import { TableRow } from '@/components/ui/table';

interface ClickableTurnRowProps {
  href: string;
  className?: string;
  children: React.ReactNode;
}

export function ClickableTurnRow({ href, className, children }: ClickableTurnRowProps) {
  const router = useRouter();

  return (
    <TableRow
      className={`cursor-pointer ${className ?? ''}`}
      onClick={() => router.push(href)}
    >
      {children}
    </TableRow>
  );
}
