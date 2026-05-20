import { useEffect } from "react";
import { logout } from "@/lib/auth";

const TIMEOUT = 15 * 60 * 1000; // 15 minutes

export function useSessionTimeout() {
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        logout();
      }, TIMEOUT);
    };

    const events = ["mousemove", "keydown", "click", "scroll"];

    events.forEach((event) =>
      window.addEventListener(event, resetTimer)
    );

    resetTimer();

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
      clearTimeout(timer);
    };
  }, []);
}
