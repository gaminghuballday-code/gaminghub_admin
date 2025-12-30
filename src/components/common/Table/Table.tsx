import React from 'react';
import './Table.scss';

export interface TableColumn<T = unknown> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface TableProps<T = unknown> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  emptyMessage?: string;
  className?: string;
  loading?: boolean;
  onRowClick?: (item: T, index: number) => void;
}

const Table = <T,>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No data available',
  className = '',
  loading = false,
  onRowClick,
}: TableProps<T>) => {
  if (loading) {
    return (
      <div className="table-loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="table-empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className={`table ${className}`}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={column.headerClassName || ''}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={keyExtractor(item, index)}
              onClick={() => onRowClick?.(item, index)}
              className={onRowClick ? 'table-row-clickable' : ''}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={column.className || ''}
                >
                  {column.render
                    ? column.render(item, index)
                    : (item as Record<string, unknown>)[column.key]?.toString() || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
