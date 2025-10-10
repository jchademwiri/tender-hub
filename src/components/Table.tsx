import React from 'react';

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
    <table className="min-w-full bg-card border border-border">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key as string} className="py-2 px-4 border-b border-border">
              {col.header}
            </th>
          ))}
          {actions && <th className="py-2 px-4 border-b border-border">Actions</th>}
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr key={index}>
            {columns.map((col) => (
              <td key={col.key as string} className="py-2 px-4 border-b border-border">
                {col.render ? col.render(item[col.key], item) : String(item[col.key])}
              </td>
            ))}
            {actions && <td className="py-2 px-4 border-b border-border">{actions(item)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}