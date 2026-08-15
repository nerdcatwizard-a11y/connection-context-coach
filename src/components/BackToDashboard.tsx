import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function BackToDashboard() {
  return (
    <Link
      to="/home"
      className="ml-11 inline-flex items-center gap-1.5 text-sm md:ml-0 text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to dashboard
    </Link>
  );
}
