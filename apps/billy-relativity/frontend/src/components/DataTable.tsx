/**
 * Data Table Component
 * Pretty, readable table display for API responses
 */

import React from 'react';
import { Table, CheckCircle, XCircle, Archive, Activity } from 'lucide-react';

interface DataTableProps {
  data: any[];
  title?: string;
}

export const DataTable: React.FC<DataTableProps> = ({ data, title }) => {
  if (!data || data.length === 0) {
    return (
      <div className="mt-4 p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-center">
        <Table className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">No data to display</p>
      </div>
    );
  }

  // Extract column headers from first object
  const columns = Object.keys(data[0]);

  // Helper to format cell values
  const formatValue = (value: any, key: string): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">null</span>;
    }

    if (typeof value === 'boolean') {
      return value ? (
        <CheckCircle className="w-4 h-4 text-green-600 inline" />
      ) : (
        <XCircle className="w-4 h-4 text-red-600 inline" />
      );
    }

    if (typeof value === 'number') {
      // Make artifact IDs more prominent
      if (key.toLowerCase().includes('artifactid') || key.toLowerCase().includes('id')) {
        return (
          <div className="flex items-center space-x-2">
            <span className="font-mono text-lg font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200">
              {value.toLocaleString()}
            </span>
          </div>
        );
      }
      return <span className="font-mono text-indigo-600">{value.toLocaleString()}</span>;
    }

    if (typeof value === 'string') {
      // Format dates
      if (key.includes('created') || key.includes('Modified') || key.includes('date')) {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return (
              <span className="text-sm text-gray-600">
                {date.toLocaleDateString()} {date.toLocaleTimeString()}
              </span>
            );
          }
        } catch (e) {
          // Not a date, continue
        }
      }

      // Highlight status
      if (key.toLowerCase().includes('status') || key.toLowerCase().includes('name')) {
        const colorMap: Record<string, string> = {
          'Active': 'bg-green-100 text-green-800',
          'Inactive': 'bg-gray-100 text-gray-800',
          'Archived': 'bg-yellow-100 text-yellow-800',
          'Error': 'bg-red-100 text-red-800'
        };

        const color = colorMap[value] || 'bg-blue-100 text-blue-800';

        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
            {value}
          </span>
        );
      }

      // URLs
      if (value.startsWith('http://') || value.startsWith('https://')) {
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 underline text-sm truncate max-w-xs inline-block"
          >
            {value}
          </a>
        );
      }

      return <span className="text-gray-700">{value}</span>;
    }

    // Objects/Arrays - show JSON
    return (
      <details className="cursor-pointer">
        <summary className="text-xs text-gray-500 hover:text-gray-700">View Object</summary>
        <pre className="text-xs mt-1 p-2 bg-gray-50 rounded overflow-x-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      </details>
    );
  };

  // Helper to format column names
  const formatColumnName = (col: string): string => {
    return col
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Determine icon for status column
  const getStatusIcon = (value: string) => {
    if (value === 'Active') return <Activity className="w-4 h-4 text-green-600" />;
    if (value === 'Archived') return <Archive className="w-4 h-4 text-yellow-600" />;
    return null;
  };

  return (
    <div className="mt-6">
      {title && (
        <div className="flex items-center space-x-2 mb-4">
          <Table className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <span className="text-sm text-gray-500">({data.length} records)</span>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  {formatColumnName(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-gray-50 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col}
                    className="px-6 py-4 whitespace-nowrap text-sm"
                  >
                    <div className="flex items-center space-x-2">
                      {col.toLowerCase().includes('status') && typeof row[col] === 'string' && getStatusIcon(row[col])}
                      <div>{formatValue(row[col], col)}</div>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary footer */}
      <div className="mt-3 flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
        <span>
          Showing <span className="font-semibold">{data.length}</span> {data.length === 1 ? 'record' : 'records'}
        </span>
        <span className="text-xs text-gray-500">
          {columns.length} columns
        </span>
      </div>
    </div>
  );
};
