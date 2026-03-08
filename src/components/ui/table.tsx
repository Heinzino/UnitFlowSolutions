import * as React from "react";
import { cn } from "@/lib/utils";

/* ─── Table ─────────────────────────────────────────────────────── */

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, ...props }, ref) => {
    return (
      // Horizontal scroll as baseline responsive strategy.
      // Per-view mobile card transformations will be handled at the page level
      // in later phases — the Table component provides the desktop version;
      // mobile card list is a separate rendering concern handled by consuming components.
      <div className="overflow-x-auto">
        <table
          ref={ref}
          className={cn("w-full border-collapse text-sm", className)}
          {...props}
        />
      </div>
    );
  }
);
Table.displayName = "Table";

/* ─── TableHeader ───────────────────────────────────────────────── */

export interface TableHeaderProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  TableHeaderProps
>(({ className, ...props }, ref) => {
  return <thead ref={ref} className={cn(className)} {...props} />;
});
TableHeader.displayName = "TableHeader";

/* ─── TableBody ─────────────────────────────────────────────────── */

export interface TableBodyProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  TableBodyProps
>(({ className, ...props }, ref) => {
  return <tbody ref={ref} className={cn(className)} {...props} />;
});
TableBody.displayName = "TableBody";

/* ─── TableRow ──────────────────────────────────────────────────── */

export interface TableRowProps
  extends React.HTMLAttributes<HTMLTableRowElement> {
  onRowClick?: () => void;
}

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, onRowClick, onClick, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={cn(
          "border-b border-gray-100 hover:bg-emerald/5 transition-colors",
          onRowClick && "cursor-pointer",
          className
        )}
        onClick={onRowClick ?? onClick}
        {...props}
      />
    );
  }
);
TableRow.displayName = "TableRow";

/* ─── TableHead ─────────────────────────────────────────────────── */

export interface TableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {}

export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, ...props }, ref) => {
    return (
      <th
        ref={ref}
        className={cn(
          "text-left text-text-secondary font-medium text-xs uppercase tracking-wider py-3 px-4",
          className
        )}
        {...props}
      />
    );
  }
);
TableHead.displayName = "TableHead";

/* ─── TableCell ─────────────────────────────────────────────────── */

export interface TableCellProps
  extends React.TdHTMLAttributes<HTMLTableCellElement> {}

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => {
    return (
      <td
        ref={ref}
        className={cn("py-3 px-4 text-text-primary", className)}
        {...props}
      />
    );
  }
);
TableCell.displayName = "TableCell";
