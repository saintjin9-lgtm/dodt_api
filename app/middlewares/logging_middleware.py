from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
import time
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # Add a custom header to verify if the server code is updated
        response.headers["X-Server-Version"] = str(datetime.utcnow().timestamp())
        
        logger.info(
            f"{request.method} {request.url.path} - {response.status_code} - {process_time:.4f}s"
        )
        return response
