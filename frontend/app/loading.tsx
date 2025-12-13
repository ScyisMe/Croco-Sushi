import Image from "next/image";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md">
            <div className="relative flex flex-col items-center justify-center">
                {/* Logo Container with Pulse */}
                <div className="relative w-32 h-32 mb-8 animate-pulse">
                    <Image
                        src="/logo.png"
                        alt="Loading..."
                        fill
                        className="object-contain drop-shadow-[0_0_25px_rgba(16,185,129,0.4)]"
                        priority
                    />
                </div>

                {/* Custom Spinner/Loader */}
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-3 h-3 bg-accent-gold rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-3 h-3 bg-primary-500 rounded-full animate-bounce"></span>
                </div>

                <p className="mt-4 text-white/50 text-sm font-light tracking-widest uppercase">
                    Loading...
                </p>
            </div>
        </div>
    );
}
