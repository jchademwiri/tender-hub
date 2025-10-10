import React from 'react';
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: any, item: T) => React.ReactNode;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: (item: T) => React.ReactNode;
}

export default function Table<T>({ data, columns, actions }: TableProps<T>) {
  return (
    <ShadcnTable>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.key as string}>
              {col.header}
            </TableHead>
          ))}
          {actions && <TableHead>Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item, index) => (
          <TableRow key={index}>
            {columns.map((col) => (
              <TableCell key={col.key as string}>
                {col.render ? col.render(item[col.key], item) : String(item[col.key])}
              </TableCell>
            ))}
            {actions && <TableCell>{actions(item)}</TableCell>}
          </TableRow>
        ))}
      </TableBody>
    </ShadcnTable>
  );
}