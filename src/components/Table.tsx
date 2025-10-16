import React, { memo, ReactElement } from 'react';
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Column<T> {
  key: keyof T | string;
  header: string | React.ReactNode;
  render?: (value: any, item: T) => React.ReactNode;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: (item: T) => React.ReactNode;
}

// Memoized table header component
interface TableHeaderProps<T> {
  columns: Column<T>[];
  actions?: (item: T) => React.ReactNode;
}

const TableHeaderComponent = memo(<T,>({ columns, actions }: TableHeaderProps<T>) => (
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
)) as <T>(props: TableHeaderProps<T>) => ReactElement;

// Memoized table row component
interface TableRowProps<T> {
  item: T;
  index: number;
  columns: Column<T>[];
  actions?: (item: T) => React.ReactNode;
}

const TableRowComponent = memo(<T,>({ item, index, columns, actions }: TableRowProps<T>) => (
  <TableRow key={index}>
    {columns.map((col) => (
      <TableCell key={col.key as string}>
        {col.render ? col.render((item as any)[col.key], item) : String((item as any)[col.key])}
      </TableCell>
    ))}
    {actions && <TableCell>{actions(item)}</TableCell>}
  </TableRow>
)) as <T>(props: TableRowProps<T>) => ReactElement;

// Memoized table body component
interface TableBodyProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: (item: T) => React.ReactNode;
}

const TableBodyComponent = memo(<T,>({ data, columns, actions }: TableBodyProps<T>) => (
  <TableBody>
    {data.map((item, index) => (
      <TableRowComponent
        key={index}
        item={item}
        index={index}
        columns={columns}
        actions={actions}
      />
    ))}
  </TableBody>
)) as <T>(props: TableBodyProps<T>) => ReactElement;

function Table<T>({ data, columns, actions }: TableProps<T>) {
  return (
    <ShadcnTable>
      <TableHeaderComponent columns={columns} actions={actions} />
      <TableBodyComponent data={data} columns={columns} actions={actions} />
    </ShadcnTable>
  );
}

// Export memoized version as default
export default memo(Table) as <T>(props: TableProps<T>) => ReactElement;