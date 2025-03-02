// src/components/ResponsiveTable.tsx
import React, { ReactNode } from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  isHidden?: boolean; // Optional prop to hide columns on mobile
  label?: string; // Label to use in mobile card view (defaults to header)
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  actions?: (item: T) => ReactNode;
  emptyMessage?: string;
}

export function ResponsiveTable<T>({ columns, data, keyField, actions }: ResponsiveTableProps<T>) {
  // Function to render cell content
  const getCellContent = (item: T, column: Column<T>) => {
    const accessor = column.accessor;
    if (typeof accessor === 'function') {
      return accessor(item);
    }
    return item[accessor] as ReactNode;
  };

  return (
    <>
      {/* Desktop Table View */}
      <div className="bg-white rounded-lg shadow overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column, idx) => (
                  <th 
                    key={idx} 
                    className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.header}
                  </th>
                ))}
                {actions && (
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map(item => (
                <tr key={String(item[keyField])}>
                  {columns.map((column, idx) => (
                    <td key={idx} className="px-4 md:px-6 py-4 whitespace-nowrap">
                      {getCellContent(item, column)}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      {actions(item)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        <div className="space-y-4">
          {data.map(item => (
            <div 
              key={String(item[keyField])} 
              className="bg-white rounded-lg shadow p-4"
            >
              {/* Show first column as title */}
              <div className="font-medium text-lg mb-2">
                {getCellContent(item, columns[0])}
              </div>
              
              {/* Other columns */}
              <div className="space-y-2 mb-3">
                {columns.slice(1).filter(col => !col.isHidden).map((column, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {column.label || column.header}:
                    </span>
                    <span className="font-medium">
                      {getCellContent(item, column)}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Actions */}
              {actions && (
                <div className="border-t pt-2 flex justify-end">
                  {actions(item)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}