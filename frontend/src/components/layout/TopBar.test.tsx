import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TopBar from "./TopBar";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/auth";

// mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}));

// mock auth lib
vi.mock("@/lib/auth", () => ({
  logout: vi.fn(),
}));

describe("TopBar", () => {
  const pushMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: pushMock } as any);
    vi.mocked(usePathname).mockReturnValue("/dashboard");
  });

  it("renders navigation links", () => {
    render(<TopBar />);
    expect(screen.getByText("Panel")).toBeInTheDocument();
    expect(screen.getByText("Wiadomości")).toBeInTheDocument();
    expect(screen.getByText("Płatności")).toBeInTheDocument();
    expect(screen.getByText("Konto")).toBeInTheDocument();
  });

  it("highlights the active link using aria-current", () => {
    vi.mocked(usePathname).mockReturnValue("/messages");
    render(<TopBar />);

    const messagesLink = screen.getByText("Wiadomości");
    expect(messagesLink).toHaveAttribute("aria-current", "page");

    const panelLink = screen.getByText("Panel");
    expect(panelLink).not.toHaveAttribute("aria-current");
  });

  it("shows Admin Panel button only for admins", () => {
    const { rerender } = render(<TopBar isAdmin={false} />);
    expect(screen.queryByText("Panel Administratora")).not.toBeInTheDocument();

    rerender(<TopBar isAdmin={true} />);
    expect(screen.getByText("Panel Administratora")).toBeInTheDocument();
  });

  it("renders children list and highlights selection using aria-pressed", () => {
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

  it("handles logout correctly", () => {
    render(<TopBar />);
    const logoutBtn = screen.getByText("Wyloguj");

    fireEvent.click(logoutBtn);

    expect(logout).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/login");
  });
});
