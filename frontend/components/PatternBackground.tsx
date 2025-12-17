"use client";

import React from "react";

export default function PatternBackground() {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-gradient-to-br from-surface-dark to-surface-card">
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 40c20 0 40-20 40-40V0h-80v20h20c0 10 10 20 20 20zm0 0c-20 0-40 20-40 40h80c0-20-20-40-40-40z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                    backgroundSize: '160px 160px' // Large scale for the "very large" request
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface-dark/20 to-surface-dark/80" />
        </div>
    );
}
