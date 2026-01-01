import typing
from starlette.staticfiles import StaticFiles
from starlette.responses import Response, FileResponse

class CachedStaticFiles(StaticFiles):
    """
    Custom StaticFiles class to add Cache-Control headers based on file extension.
    """
    
    def file_response(
        self,
        full_path: str, # type: ignore - StaticsFiles internals
        stat_result: typing.Any,
        scope: typing.Mapping[str, typing.Any],
        status_code: int = 200,
    ) -> Response:
        response = super().file_response(full_path, stat_result, scope, status_code)
        
        if isinstance(response, FileResponse):
            # WOFF2 Fonts: Immutable, cache for 1 year
            if full_path.endswith(".woff2"):
                response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
            
            # JSON (Lottie): Cache for 1 hour (allows updates without too long wait)
            elif full_path.endswith(".json"):
                response.headers["Cache-Control"] = "public, max-age=3600"
                
            # Defaults for other files (optional)
            # else:
            #     response.headers["Cache-Control"] = "public, max-age=3600"
                
        return response
