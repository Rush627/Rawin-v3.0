"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import CustomCursor from "./CustomCursor";

export default function PublicCustomCursor() {
  const pathname = usePathname();
  const isAdmin = Boolean(pathname?.startsWith("/admin"));

  // Ensure document cursor override is cleanly removed whenever on an admin route
  useEffect(() => {
    if (isAdmin) {
      document.documentElement.classList.remove("custom-cursor-active");
    }
  }, [isAdmin]);

  if (isAdmin) {
    return null;
  }

  return <CustomCursor />;
}
