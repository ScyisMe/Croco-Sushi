"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

export default function PlerdyScript() {
    const [shouldLoad, setShouldLoad] = useState(false);

    useEffect(() => {
        const handleInteraction = () => {
            setShouldLoad(true);
            removeEventListeners();
        };

        const removeEventListeners = () => {
            window.removeEventListener("click", handleInteraction);
            window.removeEventListener("touchstart", handleInteraction);
            window.removeEventListener("keydown", handleInteraction);
        };

        // Delay load to prioritize Main Thread for LCP/TBT
        const timer = setTimeout(() => {
            setShouldLoad(true);
            removeEventListeners();
        }, 8000); // Increased to 8s

        // Only load on explicit interaction (click/touch), not just scroll/move
        window.addEventListener("click", handleInteraction, { passive: true });
        window.addEventListener("touchstart", handleInteraction, { passive: true });
        window.addEventListener("keydown", handleInteraction, { passive: true });

        // Removed scroll/mousemove to strictly improve TBT scores on initial load

        return () => {
            removeEventListeners();
            clearTimeout(timer);
        };
    }, []);

    if (!shouldLoad) return null;

    return (
        <Script
            id="plerdy-tracking"
            strategy="lazyOnload"
            data-plerdy_code="1"
            defer
        >
            {`
        var _protocol="https:"==document.location.protocol?"https://":"http://";
        _site_hash_code = "6635de0e73b7196c0c73dd2850fa653e",_suid=71458, plerdyScript=document.createElement("script");
        plerdyScript.setAttribute("defer",""),plerdyScript.dataset.plerdymainscript="plerdymainscript",
        plerdyScript.src="https://a.plerdy.com/public/js/click/main.js?v="+Math.random();
        var plerdymainscript=document.querySelector("[data-plerdymainscript='plerdymainscript']");
        plerdymainscript&&plerdymainscript.parentNode.removeChild(plerdymainscript);
        try{document.head.appendChild(plerdyScript)}catch(t){console.log(t,"unable add script tag")}
      `}
        </Script>
    );
}
