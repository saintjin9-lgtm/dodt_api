import asyncio
import httpx
import os
import sys
from app.auth.jwt_handler import create_access_token

# Add project root to sys.path
sys.path.append(os.getcwd())

async def test_upload_with_cookie():
    # 1. Create a valid token
    token = create_access_token({"sub": "test_user", "email": "test@example.com"})
    
    # 2. Prepare a dummy CSV file
    files = {'file': ('test.csv', 'col1,col2\nval1,val2', 'text/csv')}
    
    # 3. Make request with cookie
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        # We need to run the app separately or import it. 
        # Since we can't easily run the app here without blocking, we'll assume the app is running 
        # OR we can use TestClient if we import the app.
        # Let's use TestClient for better integration testing without needing a running server.
        from app.main import app
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        # Set cookie
        client.cookies.set("access_token", f"Bearer {token}")
        
        # Upload
        response = client.post("/api/analysis/upload", files=files)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("SUCCESS: Upload accepted with cookie auth.")
        elif response.status_code == 401:
            print("FAILURE: Still 401 Unauthorized.")
        else:
            print(f"FAILURE: Unexpected status code {response.status_code}")

if __name__ == "__main__":
    asyncio.run(test_upload_with_cookie())
