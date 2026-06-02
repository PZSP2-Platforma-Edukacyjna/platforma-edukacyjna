import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AdminTable, { ColumnDef } from "./AdminTable";

type MockData = {
  id: number;
  name: string;
};

describe("AdminTable", () => {
  const data: MockData[] = [
    { id: 1, name: "Item 1" },
    { id: 2, name: "Item 2" },
  ];
  const columns: ColumnDef<MockData>[] = [
    { header: "ID", render: (item) => item.id },
    { header: "Name", render: (item) => item.name },
  ];

  it("renders table headers and data", () => {
    render(
      <AdminTable
        title="Test Table"
        data={data}
        columns={columns}
        keyExtractor={(item) => item.id}
      />,
    );

    expect(screen.getByText("Test Table")).toBeInTheDocument();
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  it("renders an empty state when there is no data", () => {
    render(
      <AdminTable
        title="Empty Table"
        data={[]}
        columns={columns}
        keyExtractor={(item) => item.id}
      />,
    );

    expect(screen.getByText("Empty Table")).toBeInTheDocument();
    expect(screen.getByText("Brak danych do wyświetlenia.")).toBeInTheDocument();
  });

  it("calls onEdit when edit button is clicked", () => {
    const onEdit = vi.fn();
    render(
      <AdminTable
        title="Test Table"
        data={data}
        columns={columns}
        keyExtractor={(item) => item.id}
        onEdit={onEdit}
      />,
    );

    const editButtons = screen.getAllByText("Edytuj");
    fireEvent.click(editButtons[0]);
    expect(onEdit).toHaveBeenCalledWith(data[0]);
  });

  it("calls onDelete when delete button is clicked", () => {
    const onDelete = vi.fn();
    window.confirm = vi.fn().mockReturnValue(true);

    render(
      <AdminTable
        title="Test Table"
        data={data}
        columns={columns}
        keyExtractor={(item) => item.id}
        onDelete={onDelete}
      />,
    );

    const deleteButtons = screen.getAllByText("Usuń");
    fireEvent.click(deleteButtons[1]);
    expect(onDelete).toHaveBeenCalledWith(data[1].id);
  });
});
