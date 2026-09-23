import type { Metadata } from "next";
import RawinErrorView from "@/components/RawinErrorView";

export const metadata: Metadata = {
  title: "404 - Page Not Found | RAWIN",
  description: "The requested page does not exist or has moved.",
};

export default function NotFound() {
  return (
    <RawinErrorView
      code="404"
      title="Page not found"
      message="The page you're looking for doesn't exist."
      actionLabel="Back to home"
      actionHref="/"
    />
  );
}
