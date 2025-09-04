"use client";

import { useEffect } from "react";

export function ReactScanProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      import("react-scan")
        .then((ReactScan) => {
          if (ReactScan && typeof ReactScan.scan === "function") {
            ReactScan.scan({
              enabled: true,
              log: false, // Set to true if you want console logging
              showToolbar: true,
              animationSpeed: "fast",
            });
          }
        })
        .catch((error) => {
          console.warn("Failed to load react-scan:", error);
        });
    }
  }, []);

  return <>{children}</>;
}
