import React, { ReactNode } from "react";

export type ColumnDef<T> = {
  header: string;
  render: (item: T) => ReactNode;
};

type Props<T> = {
  title: string;
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (item: T) => string | number;
  onEdit?: (item: T) => void;
  onDelete?: (id: number) => void;
};

export default function AdminTable<T extends { id: number }>({
  title,
  data,
  columns,
  keyExtractor,
  onEdit,
  onDelete,
}: Props<T>) {
  const actionColumnCount = onEdit || onDelete ? 1 : 0;

  return (
    <div className="flex-[2]">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b bg-gray-100">
            {columns.map((col, i) => (
              <th key={i} className="p-2">
                {col.header}
              </th>
            ))}
            {(onEdit || onDelete) && <th className="p-2">Akcje</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr className="border-b bg-gray-50">
              <td
                className="p-4 text-center text-sm text-gray-500"
                colSpan={columns.length + actionColumnCount}
              >
                Brak danych do wyświetlenia.
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="border-b bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                {columns.map((col, i) => (
                  <td key={i} className="p-2">
                    {col.render(item)}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="p-2 gap-2 flex">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="text-gray-800 font-medium hover:underline"
                      >
                        Edytuj
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item.id)}
                        className="text-red-500 hover:underline"
                      >
                        Usuń
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
