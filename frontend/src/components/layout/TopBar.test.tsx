import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TopBar from "./TopBar";
import { usePathname, useRouter } from "next/navigation";
import { logout, getUserRole } from "@/lib/auth";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  logout: vi.fn(),
  getUserRole: vi.fn(),
}));

describe("TopBar", () => {
  const pushMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: pushMock } as any);
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    vi.mocked(getUserRole).mockReturnValue("PARENT"); // default role for tests
  });

  it("renders navigation links for PARENT", () => {
    vi.mocked(getUserRole).mockReturnValue("PARENT");
    render(<TopBar />);
    expect(screen.getByText("Panel")).toBeInTheDocument();
    expect(screen.getByText("Wiadomości")).toBeInTheDocument();
    expect(screen.getByText("Płatności")).toBeInTheDocument();
    expect(screen.getByText("Konto")).toBeInTheDocument();
  });

  it("renders navigation links for TEACHER", () => {
    vi.mocked(getUserRole).mockReturnValue("TEACHER");
    render(<TopBar />);
    expect(screen.getByText("Panel")).toBeInTheDocument();
    expect(screen.getByText("Wiadomości")).toBeInTheDocument();
    expect(screen.queryByText("Płatności")).not.toBeInTheDocument();
    expect(screen.getByText("Konto")).toBeInTheDocument();
  });

  it("renders navigation links for ADMIN", () => {
    vi.mocked(getUserRole).mockReturnValue("ADMIN");
    render(<TopBar />);
    expect(screen.getByText("Panel Administratora")).toBeInTheDocument();
    expect(screen.queryByText("Panel")).not.toBeInTheDocument();
  });

  it("highlights the active link using aria-current", () => {
    vi.mocked(usePathname).mockReturnValue("/messages");
    vi.mocked(getUserRole).mockReturnValue("PARENT");
    render(<TopBar />);

    const messagesLink = screen.getByText("Wiadomości");
    expect(messagesLink).toHaveAttribute("aria-current", "page");

    const panelLink = screen.getByText("Panel");
    expect(panelLink).not.toHaveAttribute("aria-current");
  });

  it("shows Admin Panel button for admins regardless of isAdmin prop", () => {
    vi.mocked(getUserRole).mockReturnValue("ADMIN");
    render(<TopBar isAdmin={false} />);
    expect(screen.getByText("Panel Administratora")).toBeInTheDocument();
  });

  it("shows Admin Panel button when isAdmin prop is true even if role is not ADMIN", () => {
    vi.mocked(getUserRole).mockReturnValue("PARENT");
    render(<TopBar isAdmin={true} />);
    expect(screen.getByText("Panel Administratora")).toBeInTheDocument();
  });

  it("renders children list and highlights selection for PARENT", () => {
    vi.mocked(getUserRole).mockReturnValue("PARENT");
    const childList = [
      { id: 1, first_name: "Adam", last_name: "Kowalski" } as any,
      { id: 2, first_name: "Ewa", last_name: "Kowalska" } as any,
    ];
    const onSelectChild = vi.fn();

    render(
      <TopBar childList={childList} onSelectChild={onSelectChild} selectedChild={childList[0]} />,
    );

    const adamBtn = screen.getByText("Adam Kowalski");
    const ewaBtn = screen.getByText("Ewa Kowalska");

    expect(adamBtn).toBeInTheDocument();
    expect(ewaBtn).toBeInTheDocument();

    expect(adamBtn).toHaveAttribute("aria-pressed", "true");
    expect(ewaBtn).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(ewaBtn);
    expect(onSelectChild).toHaveBeenCalledWith(childList[1]);
  });

  it("does NOT render children list for TEACHER", () => {
    vi.mocked(getUserRole).mockReturnValue("TEACHER");
    const childList = [{ id: 1, first_name: "Adam", last_name: "Kowalski" } as any];
    render(<TopBar childList={childList} />);
    expect(screen.queryByText("Adam Kowalski")).not.toBeInTheDocument();
    expect(screen.getByText("Platforma edukacyjna")).toBeInTheDocument();
  });

  it("handles logout correctly", () => {
    render(<TopBar />);
    const logoutBtn = screen.getByText("Wyloguj");

    fireEvent.click(logoutBtn);

    expect(logout).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/login");
  });
});
