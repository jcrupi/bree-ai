import React, { useState } from 'react';
import './QueryBuilder.css';

interface QueryBuilderProps {
  dbPath: string;
}

export default function QueryBuilder({ dbPath }: QueryBuilderProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Array<{ field: string; operator: string; value: string }>>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddFilter = () => {
    setFilters([...filters, { field: '', operator: 'eq', value: '' }]);
  };

  const handleRemoveFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const handleFilterChange = (
    index: number,
    key: 'field' | 'operator' | 'value',
    value: string
  ) => {
    const newFilters = [...filters];
    newFilters[index][key] = value;
    setFilters(newFilters);
  };

  const handleExecuteQuery = async () => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dbPath,
          filters: filters.filter(f => f.field && f.value),
          limit: 50,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.results || []);
      } else {
        setError(data.error || 'Query failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="query-builder">
      <div className="query-panel">
        <h3>Query Builder</h3>

        <div className="query-section">
          <label>
            Filters
            <button className="btn-add-filter" onClick={handleAddFilter}>
              + Add Filter
            </button>
          </label>

          {filters.length === 0 ? (
            <p className="no-filters">No filters. Click "Add Filter" to start.</p>
          ) : (
            <div className="filters-list">
              {filters.map((filter, index) => (
                <div key={index} className="filter-row">
                  <input
                    type="text"
                    placeholder="Field name"
                    value={filter.field}
                    onChange={(e) =>
                      handleFilterChange(index, 'field', e.target.value)
                    }
                    className="filter-input"
                  />
                  <select
                    value={filter.operator}
                    onChange={(e) =>
                      handleFilterChange(index, 'operator', e.target.value)
                    }
                    className="filter-select"
                  >
                    <option value="eq">equals</option>
                    <option value="ne">not equals</option>
                    <option value="gt">greater than</option>
                    <option value="lt">less than</option>
                    <option value="contains">contains</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Value"
                    value={filter.value}
                    onChange={(e) =>
                      handleFilterChange(index, 'value', e.target.value)
                    }
                    className="filter-input"
                  />
                  <button
                    className="btn-remove"
                    onClick={() => handleRemoveFilter(index)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          className="btn-execute"
          onClick={handleExecuteQuery}
          disabled={loading}
        >
          {loading ? 'Executing...' : '🔍 Execute Query'}
        </button>

        {error && <div className="error-message">{error}</div>}
      </div>

      <div className="results-panel">
        <h3>Results ({results.length})</h3>

        {results.length === 0 ? (
          <p className="no-results">
            {loading ? 'Loading...' : 'No results. Build a query and execute it.'}
          </p>
        ) : (
          <div className="results-list">
            {results.map((result, index) => (
              <div key={index} className="result-item">
                <div className="result-header">
                  <h4>{result.name || result.id || 'Untitled'}</h4>
                  <span className="result-path">{result.path}</span>
                </div>
                <div className="result-details">
                  {Object.entries(result)
                    .slice(0, 3)
                    .map(([key, value]) => (
                      <div key={key} className="result-field">
                        <span className="field-name">{key}:</span>
                        <span className="field-value">{String(value)}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
