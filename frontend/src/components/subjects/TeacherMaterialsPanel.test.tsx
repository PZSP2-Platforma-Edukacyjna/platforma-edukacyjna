import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TeacherMaterialsPanel from "./TeacherMaterialsPanel";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}));

describe("TeacherMaterialsPanel", () => {
  const courses = [
    { id: 10, course_code: "MAT-1", name: "Matematyka" },
    { id: 11, course_code: "FIZ-2", name: "Fizyka" },
  ];

  const materials = [
    {
      id: 1,
      course: 10,
      course_name: "Matematyka",
      course_code: "MAT-1",
      title: "Algebra PDF",
      description: "Równania",
      url: "https://drive.google.com/file/d/algebra/view?usp=sharing",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(window, "alert").mockImplementation(() => undefined);
    vi.mocked(apiGet).mockResolvedValue(materials);
    vi.mocked(apiPost).mockResolvedValue({ id: 2, ...materials[0], course: 11 });
    vi.mocked(apiPatch).mockResolvedValue({ ...materials[0], title: "Algebra rozszerzona" });
    vi.mocked(apiDelete).mockResolvedValue(undefined);
  });

  it("loads teacher materials", async () => {
    render(<TeacherMaterialsPanel courses={courses} />);

    expect(screen.getByText("Ładowanie...")).toBeInTheDocument();
    expect(await screen.findByText("Algebra PDF")).toBeInTheDocument();
    expect(screen.getAllByText("Matematyka (MAT-1)").length).toBeGreaterThan(0);
    expect(apiGet).toHaveBeenCalledWith("/api/learning-materials/");
  });

  it("allows adding a Google Drive material", async () => {
    render(<TeacherMaterialsPanel courses={courses} />);

    await screen.findByText("Algebra PDF");

    fireEvent.change(screen.getByLabelText("Kurs materiału"), { target: { value: "11" } });
    fireEvent.change(screen.getByPlaceholderText("Tytuł materiału"), {
      target: { value: "Dynamika" },
    });
    fireEvent.change(screen.getByPlaceholderText("Link Google Drive"), {
      target: { value: "https://drive.google.com/file/d/dynamika/view?usp=sharing" },
    });
    fireEvent.change(screen.getByPlaceholderText("Opis materiału"), {
      target: { value: "Zadania" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Dodaj" }));

    await waitFor(() => {
      expect(apiPost).toHaveBeenCalledWith("/api/learning-materials/", {
        course: 11,
        title: "Dynamika",
        description: "Zadania",
        url: "https://drive.google.com/file/d/dynamika/view?usp=sharing",
      });
    });
  });

  it("allows editing and deleting a material", async () => {
    render(<TeacherMaterialsPanel courses={courses} />);

    await screen.findByText("Algebra PDF");

    fireEvent.click(screen.getByRole("button", { name: "Edytuj" }));
    fireEvent.change(screen.getByPlaceholderText("Tytuł materiału"), {
      target: { value: "Algebra rozszerzona" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Zapisz" }));

    await waitFor(() => {
      expect(apiPatch).toHaveBeenCalledWith("/api/learning-materials/1/", {
        course: 10,
        title: "Algebra rozszerzona",
        description: "Równania",
        url: "https://drive.google.com/file/d/algebra/view?usp=sharing",
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "Usuń" }));

    await waitFor(() => {
      expect(apiDelete).toHaveBeenCalledWith("/api/learning-materials/1/");
    });
  });
});
