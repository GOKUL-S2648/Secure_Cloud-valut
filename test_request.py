import requests
import json

url = "http://127.0.0.1:5000/api/access-requests"
# Use a known valid file ID from our previous dir/grep search
# Cloud-valut-main.zip -> id: 52ef3b3d-e107-4228-8c73-35a3c9a7b10b
file_id = "52ef3b3d-e107-4228-8c73-35a3c9a7b10b"

payload = {
    "fileId": file_id,
    "ownerId": "undefined", # Simulate the potential problem we saw
    "requesterKey": "TESTKEY1"
}

try:
    print(f"Sending request for file {file_id}...")
    response = requests.post(url, json=payload)
    print("Status Code:", response.status_code)
    print("Response:", response.json())
except Exception as e:
    print("Error:", e)
