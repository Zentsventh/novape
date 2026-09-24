import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function TwentyTable({ columns, data, onRowClick, selectedRows = [], onSelectionChange }) {
    
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            onSelectionChange(data.map(row => row.id));
        } else {
            onSelectionChange([]);
        }
    };

    const handleSelectRow = (e, id) => {
        e.stopPropagation();
        if (e.target.checked) {
            onSelectionChange([...selectedRows, id]);
        } else {
            onSelectionChange(selectedRows.filter(rowId => rowId !== id));
        }
    };

    return (
        <div style={{ 
            backgroundColor: 'var(--twenty-bg-surface)', 
            border: '1px solid var(--twenty-border)',
            borderRadius: 'var(--twenty-radius-lg)',
            overflow: 'hidden',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--twenty-border-strong)', backgroundColor: 'var(--twenty-bg-app)' }}>
                            <th style={{ width: 40, padding: '10px 16px', textAlign: 'center' }}>
                                <input 
                                    type="checkbox" 
                                    checked={data.length > 0 && selectedRows.length === data.length}
                                    onChange={handleSelectAll}
                                    style={{ margin: 0, cursor: 'pointer' }}
                                />
                            </th>
                            {columns.map((col, i) => (
                                <th key={i} style={{ 
                                    padding: '10px 16px', 
                                    fontSize: '12px', 
                                    fontWeight: 600, 
                                    color: 'var(--twenty-text-secondary)',
                                    whiteSpace: 'nowrap'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {col.header}
                                        {col.sortable && <ChevronDown size={14} style={{ color: 'var(--twenty-text-muted)' }} />}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIndex) => (
                            <tr 
                                key={row.id || rowIndex} 
                                onClick={() => onRowClick && onRowClick(row)}
                                style={{ 
                                    borderBottom: rowIndex < data.length - 1 ? '1px solid var(--twenty-border)' : 'none',
                                    cursor: onRowClick ? 'pointer' : 'default',
                                    transition: 'background-color 0.1s',
                                    backgroundColor: selectedRows.includes(row.id) ? 'var(--twenty-primary-bg)' : 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                    if (!selectedRows.includes(row.id)) e.currentTarget.style.backgroundColor = 'var(--twenty-bg-hover)';
                                }}
                                onMouseLeave={(e) => {
                                    if (!selectedRows.includes(row.id)) e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                <td style={{ padding: '10px 16px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedRows.includes(row.id)}
                                        onChange={(e) => handleSelectRow(e, row.id)}
                                        style={{ margin: 0, cursor: 'pointer' }}
                                    />
                                </td>
                                {columns.map((col, colIndex) => (
                                    <td key={colIndex} style={{ 
                                        padding: '10px 16px', 
                                        fontSize: '13px', 
                                        color: col.primary ? 'var(--twenty-text-main)' : 'var(--twenty-text-secondary)',
                                        fontWeight: col.primary ? 500 : 400
                                    }}>
                                        {col.render ? col.render(row) : row[col.accessor]}
                                    </td>
                                ))}
                                </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={columns.length + 1} style={{ padding: '40px', textAlign: 'center', color: 'var(--twenty-text-muted)', fontSize: '13px' }}>
                                    No se encontraron registros.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
