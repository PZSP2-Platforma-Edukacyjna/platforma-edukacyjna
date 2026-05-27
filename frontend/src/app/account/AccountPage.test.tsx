import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AccountPage from "./page";
import { apiGet } from "@/lib/api";
import { logout } from "@/lib/auth";
import { formatTokenDate, getAccessTokenPayload } from "@/lib/session";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("@/components/layout/TopBar", () => ({
  default: () => <nav>TopBar</nav>,
}));

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  logout: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  formatTokenDate: vi.fn(),
  getAccessTokenPayload: vi.fn(),
}));

describe("AccountPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAccessTokenPayload).mockReturnValue({
      user_id: 7,
      token_type: "access",
      exp: 1_893_456_000,
    });
    vi.mocked(formatTokenDate).mockReturnValue("1 sty 2030, 12:00");
    vi.mocked(apiGet).mockImplementation((path) => {
      if (path === "/api/my-children/") {
        return Promise.resolve([
          {
            id: 10,
            first_name: "Ala",
            last_name: "Nowak",
            date_of_birth: "2016-04-12",
            enrolled_courses: [100],
          },
        ]);
      }

      if (path === "/api/my-children/schedule/") {
        return Promise.resolve([
          {
            id: 20,
            course: 100,
            course_name: "Matematyka",
            topic: "Równania",
            date: "2030-06-01T10:00:00Z",
            teacher: 5,
          },
        ]);
      }

      return Promise.reject(new Error(`Unexpected path: ${path}`));
    });
  });

  it("renders session data, children and upcoming lessons", async () => {
    render(<AccountPage />);

    expect(await screen.findByText("Dzieci pod opieką")).toBeInTheDocument();

    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("access")).toBeInTheDocument();
    expect(screen.getByText("1 sty 2030, 12:00")).toBeInTheDocument();
    expect(screen.getByText("Ala Nowak")).toBeInTheDocument();
    expect(screen.getByText("Matematyka")).toBeInTheDocument();
    expect(screen.getByText("Równania")).toBeInTheDocument();
  });

  it("logs out and redirects to login", () => {
    render(<AccountPage />);

    fireEvent.click(screen.getByRole("button", { name: /Wyloguj/i }));

    expect(logout).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/login");
  });
});
