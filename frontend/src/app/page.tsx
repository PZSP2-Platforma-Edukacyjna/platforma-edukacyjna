import { redirect } from "next/navigation";
import { isUserLoggedIn } from "@/lib/auth";

export default function Home() {
  if (isUserLoggedIn()) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
