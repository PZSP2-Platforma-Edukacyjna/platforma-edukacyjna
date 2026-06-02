import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MaterialsAdmin from "./MaterialsAdmin";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}));

describe("MaterialsAdmin", () => {
  const courses = [
    { id: 101, course_code: "MAT-1", name: "Matematyka" },
    { id: 102, course_code: "FIZ-2", name: "Fizyka" },
  ];

  const materials = [
    {
      id: 1,
      course: 101,
      course_name: "Matematyka",
      course_code: "MAT-1",
      title: "Algebra PDF",
      description: "Równania i funkcje",
      url: "https://drive.google.com/file/d/algebra/view?usp=sharing",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(window, "alert").mockImplementation(() => undefined);

    vi.mocked(apiGet).mockImplementation((path: string) => {
      if (path === "/api/learning-materials/") {
        return Promise.resolve(materials);
      }

      if (path === "/api/manage/courses/") {
        return Promise.resolve(courses);
      }

      return Promise.reject(new Error(`Unexpected path: ${path}`));
    });

    vi.mocked(apiPost).mockResolvedValue({ id: 2, ...materials[0], course: 102 });
    vi.mocked(apiPatch).mockResolvedValue({ ...materials[0], title: "Algebra rozszerzona" });
    vi.mocked(apiDelete).mockResolvedValue(undefined);
  });

  it("loads learning materials and course names", async () => {
    render(<MaterialsAdmin />);

    expect(screen.getByText("Ładowanie...")).toBeInTheDocument();
    expect(await screen.findByText("Lista materiałów")).toBeInTheDocument();

    expect(apiGet).toHaveBeenCalledWith("/api/learning-materials/");
    expect(apiGet).toHaveBeenCalledWith("/api/manage/courses/");

    const table = screen.getByRole("table");
    expect(within(table).getByText("Algebra PDF")).toBeInTheDocument();
    expect(within(table).getByText("Matematyka (MAT-1)")).toBeInTheDocument();
    expect(within(table).getByText("Równania i funkcje")).toBeInTheDocument();
    expect(within(table).getByRole("link", { name: "Otwórz" })).toHaveAttribute(
      "href",
      "https://drive.google.com/file/d/algebra/view?usp=sharing",
    );
  });

  it("allows adding a learning material", async () => {
    render(<MaterialsAdmin />);

    await screen.findByText("Dodaj materiał");

    fireEvent.change(screen.getByLabelText("Kurs"), { target: { value: "102" } });
    fireEvent.change(screen.getByPlaceholderText("Tytuł materiału"), {
      target: { value: "Dynamika" },
    });
    fireEvent.change(screen.getByPlaceholderText("Link Google Drive"), {
      target: { value: "https://drive.google.com/file/d/dynamika/view?usp=sharing" },
    });
    fireEvent.change(screen.getByPlaceholderText("Opis materiału"), {
      target: { value: "Zadania do lekcji" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Dodaj" }));

    await waitFor(() => {
      expect(apiPost).toHaveBeenCalledWith("/api/learning-materials/", {
        course: 102,
        title: "Dynamika",
        description: "Zadania do lekcji",
        url: "https://drive.google.com/file/d/dynamika/view?usp=sharing",
      });
    });
  });

  it("allows editing and deleting a learning material", async () => {
    render(<MaterialsAdmin />);

    await screen.findByText("Lista materiałów");

    fireEvent.click(screen.getByRole("button", { name: /edytuj/i }));
    fireEvent.change(screen.getByPlaceholderText("Tytuł materiału"), {
      target: { value: "Algebra rozszerzona" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Zapisz" }));

    await waitFor(() => {
      expect(apiPatch).toHaveBeenCalledWith("/api/learning-materials/1/", {
        course: 101,
        title: "Algebra rozszerzona",
        description: "Równania i funkcje",
        url: "https://drive.google.com/file/d/algebra/view?usp=sharing",
      });
    });

    fireEvent.click(screen.getByRole("button", { name: /usu/i }));

    await waitFor(() => {
      expect(apiDelete).toHaveBeenCalledWith("/api/learning-materials/1/");
    });
  });
});
