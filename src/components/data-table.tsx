import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Trophy, Medal } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Row = { id: string; [key: string]: string };

interface DraggableColumnHeaderProps {
  col: { id: string; name: string };
  onEdit: () => void;
  onDelete: () => void;
  isEditing: boolean;
  columnName: string;
  onNameChange: (name: string) => void;
  onNameBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

function ColumnHeader({
  col,
  onDelete,
  isEditing,
  columnName,
  onNameChange,
  onNameBlur,
  onKeyDown,
}: DraggableColumnHeaderProps) {
  return (
    <th
      className={`px-4 py-3 text-left font-semibold border-b ${
        col.id === 'col1' ? 'w-40' : col.id === 'col5' ? 'w-28' : 'w-24'
      }`}
    >
      <div className="flex items-center justify-between gap-2 group">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-6 h-6 flex-shrink-0" />
          {isEditing ? (
            <Input
              value={columnName}
              onChange={(e) => onNameChange(e.target.value)}
              onBlur={onNameBlur}
              onKeyDown={onKeyDown}
              autoFocus
              className="h-8 text-sm"
            />
          ) : (
            <span>{columnName}</span>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {col.id !== 'col1' && col.id !== 'col5' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:text-red-600 cursor-pointer"
              onClick={onDelete}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    </th>
  );
}

export function DataTable() {
  const [columns, setColumns] = useState([
    { id: 'col1', name: 'Name' },
    { id: 'col2', name: 'Time #1' },
    { id: 'col3', name: 'Time #2' },
    { id: 'col4', name: 'Time #3' },
    { id: 'col5', name: 'Average' },
  ]);

  const [rows, setRows] = useState<Row[]>([
    {
      id: 'row1',
      col1: 'Albert',
      col2: '10.0',
      col3: '10.1',
      col4: '10.2',
    },
    {
      id: 'row2',
      col1: 'Jennie',
      col2: '11.0',
      col3: '11.1',
      col4: '11.2',
    },
    {
      id: 'row3',
      col1: 'Joanna',
      col2: '12.0',
      col3: '12.1',
      col4: '12.2',
    },
    {
      id: 'row4',
      col1: 'Ian',
      col2: '13.0',
      col3: '13.1',
      col4: '13.2',
    },
    {
      id: 'row5',
      col1: 'Kevin',
      col2: '14.0',
      col3: '14.1',
      col4: '14.2',
    },
  ]);

  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    colId: string;
  } | null>(null);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: 'row' | 'column' | null;
    id: string | null;
  }>({
    open: false,
    type: null,
    id: null,
  });
  const [pendingChanges, setPendingChanges] = useState<
    Record<string, Record<string, string>>
  >({});

  const addColumn = () => {
    const newColId = `col${Date.now()}`;
    const timeColumnCount = columns.filter((col) =>
      col.name.startsWith('Time #')
    ).length;
    const newColumnName = `Time #${timeColumnCount + 1}`;

    const averageColumnIndex = columns.findIndex((col) => col.id === 'col5');
    const newColumns =
      averageColumnIndex !== -1
        ? [
            ...columns.slice(0, averageColumnIndex),
            { id: newColId, name: newColumnName },
            ...columns.slice(averageColumnIndex),
          ]
        : [...columns, { id: newColId, name: newColumnName }];

    setColumns(newColumns);
    setRows(rows.map((row) => ({ ...row, [newColId]: '' })));
  };

  const addRow = () => {
    const newRow: { id: string; [key: string]: string } = {
      id: `row${Date.now()}`,
    };
    columns.forEach((col) => {
      newRow[col.id] = '';
    });
    setRows([...rows, newRow]);
  };

  const deleteColumn = (colId: string) => {
    setColumns(columns.filter((col) => col.id !== colId));
    setRows(
      rows.map((row) => {
        const newRow = { ...row };
        delete newRow[colId];
        return newRow;
      })
    );
    setDeleteDialog({ open: false, type: null, id: null });
  };

  const deleteRow = (rowId: string) => {
    setRows(rows.filter((row) => row.id !== rowId));
    setDeleteDialog({ open: false, type: null, id: null });
  };

  const updateCell = (rowId: string, colId: string, value: string) => {
    setPendingChanges((prev) => ({
      ...prev,
      [rowId]: { ...prev[rowId], [colId]: value },
    }));
  };

  const commitCell = (rowId: string, colId: string) => {
    const value = pendingChanges[rowId]?.[colId];
    if (value !== undefined) {
      setRows(
        rows.map((row) => (row.id === rowId ? { ...row, [colId]: value } : row))
      );
      setPendingChanges((prev) => {
        const updated = { ...prev[rowId] };
        delete updated[colId];
        return { ...prev, [rowId]: updated };
      });
    }
  };

  const updateColumnName = (colId: string, name: string) => {
    setColumns(
      columns.map((col) => (col.id === colId ? { ...col, name } : col))
    );
  };

  const calculateAverage = (row: Row): string => {
    const timeColumns = columns.filter((col) => col.name.startsWith('Time #'));
    const timeValues = timeColumns
      .map((col) => parseFloat(row[col.id]))
      .filter((val) => !isNaN(val));
    const avg =
      timeValues.length > 0
        ? timeValues.reduce((a, b) => a + b, 0) / timeValues.length
        : 0;
    return avg.toFixed(2);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Cubing Ranks</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={addColumn}
            variant="outline"
            size="sm"
            className="cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Time Column
          </Button>
          <Button onClick={addRow} size="sm" className="cursor-pointer">
            <Plus className="w-4 h-4 mr-2" />
            Add Row
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-layout-fixed">
            <thead className="bg-gray-200">
              <tr>
                {columns.map((col) => (
                  <ColumnHeader
                    key={col.id}
                    col={col}
                    isEditing={editingColumn === col.id}
                    columnName={col.name}
                    onEdit={() => setEditingColumn(col.id)}
                    onDelete={() =>
                      setDeleteDialog({
                        open: true,
                        type: 'column',
                        id: col.id,
                      })
                    }
                    onNameChange={(name) => updateColumnName(col.id, name)}
                    onNameBlur={() => setEditingColumn(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingColumn(null);
                    }}
                  />
                ))}
                <th className="px-4 py-3 w-20 border-b"></th>
              </tr>
            </thead>
            <tbody>
              {rows
                .sort((a, b) => {
                  const aAvg = parseFloat(calculateAverage(a)) || 0;
                  const bAvg = parseFloat(calculateAverage(b)) || 0;
                  return aAvg - bAvg;
                })
                .map((row, index) => (
                  <tr
                    key={row.id}
                    className={`border-b group ${index % 2 === 1 ? 'bg-gray-50' : ''}`}
                  >
                    {columns.map((col) => (
                      <td
                        key={`${row.id}-${col.id}`}
                        className={`px-4 py-2 overflow-hidden ${
                          col.id === 'col1'
                            ? 'w-40'
                            : col.id === 'col5'
                              ? 'w-28'
                              : 'w-32'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {col.id === 'col1' ? (
                            <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                              {index === 0 ? (
                                <Trophy className="w-4 h-4 text-yellow-500" />
                              ) : index === 1 ? (
                                <Medal className="w-4 h-4 text-gray-400" />
                              ) : index === 2 ? (
                                <Medal className="w-4 h-4 text-orange-600" />
                              ) : null}
                            </div>
                          ) : (
                            <div className="w-6 h-6 flex-shrink-0" />
                          )}
                          {col.id === 'col5' ? (
                            <div className="cursor-default min-h-[32px] flex items-center flex-1 min-w-0">
                              {calculateAverage(row)}
                            </div>
                          ) : editingCell?.rowId === row.id &&
                            editingCell?.colId === col.id ? (
                            <Input
                              value={
                                pendingChanges[row.id]?.[col.id] ?? row[col.id]
                              }
                              onChange={(e) =>
                                updateCell(row.id, col.id, e.target.value)
                              }
                              onBlur={() => {
                                commitCell(row.id, col.id);
                                setEditingCell(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  commitCell(row.id, col.id);
                                  setEditingCell(null);
                                }
                              }}
                              autoFocus
                              className="h-8 flex-1 min-w-0 box-border"
                            />
                          ) : (
                            <div
                              className="cursor-pointer min-h-[32px] flex items-center hover:bg-gray-100 px-2 -mx-2 rounded flex-1 min-w-0"
                              onClick={() =>
                                setEditingCell({
                                  rowId: row.id,
                                  colId: col.id,
                                })
                              }
                            >
                              {row[col.id] || (
                                <span className="text-gray-400">
                                  Click to edit
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    ))}
                    <td className="px-4 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:text-red-600 cursor-pointer"
                        onClick={() =>
                          setDeleteDialog({
                            open: true,
                            type: 'row',
                            id: row.id,
                          })
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {rows.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No rows yet. Click "Add Row" to get started.</p>
        </div>
      )}

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this {deleteDialog.type}. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteDialog.type === 'column' && deleteDialog.id) {
                  deleteColumn(deleteDialog.id);
                } else if (deleteDialog.id) {
                  deleteRow(deleteDialog.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700 cursor-pointer"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
