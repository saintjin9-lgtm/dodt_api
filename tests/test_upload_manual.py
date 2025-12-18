from fastapi.testclient import TestClient
from app.main import app
from app.dependencies.auth import get_current_user
import os

# Mock user
async def mock_get_current_user():
    return {"sub": "1", "email": "test@example.com", "role": "MEMBER", "name": "Test User", "picture": "http://example.com/pic.jpg"}

app.dependency_overrides[get_current_user] = mock_get_current_user

client = TestClient(app)

def test_upload_csv():
    # Create a dummy CSV file
    csv_content = "age,income,score\n25,50000,80\n30,60000,85\n35,70000,90\n40,80000,95\n22,45000,75\n28,55000,82\n45,90000,92\n50,100000,98"
    files = {"file": ("test_upload.csv", csv_content, "text/csv")}
    
    print("Sending request...")
    response = client.post("/api/analysis/upload", files=files)
    
    if response.status_code != 200:
        print(f"Failed: {response.status_code}")
        print(response.text)
        return

    data = response.json()
    if "clusters" in data and "personas" in data:
        print("Response structure valid.")
    else:
        print("Response structure invalid.")
    
    files_dir = "app/static/files"
    files = os.listdir(files_dir)
    if len(files) > 0:
        print(f"Files found in storage: {files}")
    else:
        print("No files found in storage.")
    
    print("Upload successful. Response:", data)

if __name__ == "__main__":
    test_upload_csv()
