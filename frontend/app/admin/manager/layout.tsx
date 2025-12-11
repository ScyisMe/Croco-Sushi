export default function ManagerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Use a full-screen layout distinct from the main site and main admin panel
    // to minimize distractions.
    return (
        <div className="min-h-screen bg-surface-dark text-white flex flex-col overflow-hidden">
            {children}
        </div>
    );
}
