/**
 * TableNode - Table node with editable rows and columns
 *
 * Features:
 * - Editable cells
 * - Add/remove rows and columns
 * - Resizable
 * - Connection handles
 */

import { memo, useCallback, useState } from 'react';
import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { nanoid } from 'nanoid';
import type { DiagramNode, TableColumn, TableRow } from '../types';
import { DEFAULT_TEXT_STYLE } from '../types';
import { useXYFlowStore } from '../store';

// =============================================================================
// Constants
// =============================================================================

const MIN_WIDTH = 200;
const MIN_HEIGHT = 120;
const HEADER_HEIGHT = 32;
const DEFAULT_COLUMN_WIDTH = 100;

// =============================================================================
// Default Data
// =============================================================================

const createDefaultColumns = (): TableColumn[] => [
    { id: nanoid(6), header: 'Column 1', width: DEFAULT_COLUMN_WIDTH },
    { id: nanoid(6), header: 'Column 2', width: DEFAULT_COLUMN_WIDTH },
];

const createDefaultRows = (columns: TableColumn[]): TableRow[] => [
    { id: nanoid(6), cells: Object.fromEntries(columns.map((col) => [col.id, ''])) },
    { id: nanoid(6), cells: Object.fromEntries(columns.map((col) => [col.id, ''])) },
];

// =============================================================================
// Component
// =============================================================================

export const TableNode = memo(({ id, data, selected }: NodeProps<DiagramNode>) => {
    const { label = 'Table', style, textStyle } = data ?? {};
    const updateNodeData = useXYFlowStore((s) => s.updateNodeData);

    // Initialize columns and rows from data or defaults
    const columns: TableColumn[] = data?.tableColumns ?? createDefaultColumns();
    const rows: TableRow[] = data?.tableRows ?? createDefaultRows(columns);

    const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null);
    const [editingHeader, setEditingHeader] = useState<string | null>(null);

    const labelStyle = { ...DEFAULT_TEXT_STYLE, ...textStyle };

    // Use explicit style if provided, otherwise use CSS variables
    const fill = style?.fill ?? 'var(--element-fill, #ffffff)';
    const stroke = style?.stroke ?? 'var(--element-stroke, #1e293b)';
    const strokeWidth = style?.strokeWidth ?? 1;
    const textColor = textStyle?.color ?? 'var(--theme-text, #1e1e1e)';

    // Update table data in store
    const updateTable = useCallback(
        (newColumns: TableColumn[], newRows: TableRow[]) => {
            updateNodeData(id, {
                tableColumns: newColumns,
                tableRows: newRows,
            });
        },
        [id, updateNodeData]
    );

    // Add column
    const handleAddColumn = useCallback(() => {
        const newCol: TableColumn = {
            id: nanoid(6),
            header: `Col ${columns.length + 1}`,
            width: DEFAULT_COLUMN_WIDTH,
        };
        const newColumns = [...columns, newCol];
        const newRows = rows.map((row) => ({
            ...row,
            cells: { ...row.cells, [newCol.id]: '' },
        }));
        updateTable(newColumns, newRows);
    }, [columns, rows, updateTable]);

    // Remove column
    const handleRemoveColumn = useCallback(
        (colId: string) => {
            if (columns.length <= 1) return;
            const newColumns = columns.filter((c) => c.id !== colId);
            const newRows = rows.map((row) => {
                const { [colId]: _, ...restCells } = row.cells;
                return { ...row, cells: restCells };
            });
            updateTable(newColumns, newRows);
        },
        [columns, rows, updateTable]
    );

    // Add row
    const handleAddRow = useCallback(() => {
        const newRow: TableRow = {
            id: nanoid(6),
            cells: Object.fromEntries(columns.map((col) => [col.id, ''])),
        };
        updateTable(columns, [...rows, newRow]);
    }, [columns, rows, updateTable]);

    // Remove row
    const handleRemoveRow = useCallback(
        (rowId: string) => {
            if (rows.length <= 1) return;
            updateTable(
                columns,
                rows.filter((r) => r.id !== rowId)
            );
        },
        [columns, rows, updateTable]
    );

    // Update cell value
    const handleCellChange = useCallback(
        (rowId: string, colId: string, value: string) => {
            const newRows = rows.map((row) =>
                row.id === rowId ? { ...row, cells: { ...row.cells, [colId]: value } } : row
            );
            updateTable(columns, newRows);
        },
        [columns, rows, updateTable]
    );

    // Update header
    const handleHeaderChange = useCallback(
        (colId: string, value: string) => {
            const newColumns = columns.map((col) =>
                col.id === colId ? { ...col, header: value } : col
            );
            updateTable(newColumns, rows);
        },
        [columns, rows, updateTable]
    );

    return (
        <>
            <NodeResizer
                minWidth={MIN_WIDTH}
                minHeight={MIN_HEIGHT}
                isVisible={selected}
                lineStyle={{ borderColor: 'var(--theme-primary, #3b82f6)' }}
                handleStyle={{ backgroundColor: 'var(--theme-primary, #3b82f6)', borderColor: 'var(--theme-primary, #3b82f6)' }}
            />
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: fill,
                    border: `${strokeWidth}px solid ${stroke}`,
                    borderRadius: style?.cornerRadius ?? 4,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: selected ? '0 0 0 2px var(--theme-primary, #3b82f6)' : 'none',
                }}
            >
                {/* Connection Handles */}
                <Handle type="source" position={Position.Top} id="top" isConnectableStart isConnectableEnd />
                <Handle type="source" position={Position.Right} id="right" isConnectableStart isConnectableEnd />
                <Handle type="source" position={Position.Bottom} id="bottom" isConnectableStart isConnectableEnd />
                <Handle type="source" position={Position.Left} id="left" isConnectableStart isConnectableEnd />

                {/* Title */}
                <div
                    style={{
                        height: HEADER_HEIGHT,
                        backgroundColor: stroke,
                        color: 'var(--theme-text-inverse, #ffffff)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 0.5rem',
                        fontSize: labelStyle.fontSize,
                        fontWeight: 600,
                    }}
                >
                    <span>{label}</span>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                            onClick={handleAddColumn}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '1.25rem',
                                height: '1.25rem',
                                border: 'none',
                                borderRadius: '0.25rem',
                                background: 'rgba(255,255,255,0.2)',
                                color: '#fff',
                                cursor: 'pointer',
                            }}
                            title="Add column"
                        >
                            <Plus size={12} />
                        </button>
                        <button
                            onClick={handleAddRow}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '1.25rem',
                                height: '1.25rem',
                                border: 'none',
                                borderRadius: '0.25rem',
                                background: 'rgba(255,255,255,0.2)',
                                color: '#fff',
                                cursor: 'pointer',
                            }}
                            title="Add row"
                        >
                            <GripVertical size={12} />
                        </button>
                    </div>
                </div>

                {/* Table content */}
                <div style={{ flex: 1, overflow: 'auto' }}>
                    <table
                        style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '0.75rem',
                        }}
                    >
                        {/* Header row */}
                        <thead>
                            <tr>
                                {columns.map((col) => (
                                    <th
                                        key={col.id}
                                        style={{
                                            padding: '0.25rem 0.5rem',
                                            borderBottom: `1px solid var(--theme-border, #e5e7eb)`,
                                            borderRight: `1px solid var(--theme-border, #e5e7eb)`,
                                            backgroundColor: 'var(--theme-surface, #f9fafb)',
                                            fontWeight: 600,
                                            textAlign: 'left',
                                            position: 'relative',
                                            color: textColor,
                                        }}
                                    >
                                        {editingHeader === col.id ? (
                                            <input
                                                type="text"
                                                value={col.header}
                                                onChange={(e) => handleHeaderChange(col.id, e.target.value)}
                                                onBlur={() => setEditingHeader(null)}
                                                onKeyDown={(e) => e.key === 'Enter' && setEditingHeader(null)}
                                                autoFocus
                                                style={{
                                                    width: '100%',
                                                    border: 'none',
                                                    background: 'transparent',
                                                    fontSize: 'inherit',
                                                    fontWeight: 'inherit',
                                                    outline: 'none',
                                                }}
                                            />
                                        ) : (
                                            <div
                                                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                                onDoubleClick={() => setEditingHeader(col.id)}
                                            >
                                                <span style={{ flex: 1 }}>{col.header}</span>
                                                {columns.length > 1 && (
                                                    <button
                                                        onClick={() => handleRemoveColumn(col.id)}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            width: '1rem',
                                                            height: '1rem',
                                                            border: 'none',
                                                            background: 'transparent',
                                                            color: '#ef4444',
                                                            cursor: 'pointer',
                                                            opacity: 0.5,
                                                        }}
                                                        title="Remove column"
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        {/* Data rows */}
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.id}>
                                    {columns.map((col) => (
                                        <td
                                            key={col.id}
                                            style={{
                                                padding: '0.25rem 0.5rem',
                                                borderBottom: `1px solid var(--theme-border, #e5e7eb)`,
                                                borderRight: `1px solid var(--theme-border, #e5e7eb)`,
                                                color: textColor,
                                            }}
                                        >
                                            {editingCell?.rowId === row.id && editingCell?.colId === col.id ? (
                                                <input
                                                    type="text"
                                                    value={row.cells[col.id] ?? ''}
                                                    onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                                                    onBlur={() => setEditingCell(null)}
                                                    onKeyDown={(e) => e.key === 'Enter' && setEditingCell(null)}
                                                    autoFocus
                                                    style={{
                                                        width: '100%',
                                                        border: 'none',
                                                        background: 'transparent',
                                                        fontSize: 'inherit',
                                                        outline: 'none',
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        minHeight: '1rem',
                                                    }}
                                                    onDoubleClick={() => setEditingCell({ rowId: row.id, colId: col.id })}
                                                >
                                                    {row.cells[col.id] || <span style={{ opacity: 0.3 }}>—</span>}
                                                </div>
                                            )}
                                        </td>
                                    ))}
                                    {rows.length > 1 && (
                                        <td style={{ width: '1.5rem', padding: '0.125rem' }}>
                                            <button
                                                onClick={() => handleRemoveRow(row.id)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '1rem',
                                                    height: '1rem',
                                                    border: 'none',
                                                    background: 'transparent',
                                                    color: '#ef4444',
                                                    cursor: 'pointer',
                                                    opacity: 0.5,
                                                }}
                                                title="Remove row"
                                            >
                                                <Trash2 size={10} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
});

TableNode.displayName = 'TableNode';
