"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import apiClient from "@/lib/api/apiClient";
import MaintenanceOverlay from "./MaintenanceOverlay";

export default function MaintenanceGuard() {
    const pathname = usePathname();
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkMaintenanceStatus = async () => {
            try {
                // Skip check for admin pages immediately
                if (pathname?.startsWith("/admin") || pathname?.startsWith("/login")) {
                    setIsLoading(false);
                    return;
                }

                const response = await apiClient.get("/settings/public");
                setIsMaintenance(response.data.is_maintenance_mode);
            } catch (error) {
                console.error("Failed to check maintenance status", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkMaintenanceStatus();

        // Setup polling every minute to check if maintenance is turned off
        const interval = setInterval(checkMaintenanceStatus, 60000);
        return () => clearInterval(interval);
    }, [pathname]);

    // Don't show anything while loading or if on admin/login page
    if (isLoading || pathname?.startsWith("/admin") || pathname?.startsWith("/login")) {
        return null;
    }

    if (isMaintenance) {
        return <MaintenanceOverlay />;
    }

    return null;
}
