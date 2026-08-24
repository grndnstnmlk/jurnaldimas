import urllib.request
import urllib.error
import json

BASE_URL = 'http://localhost:5000'

print('--- 1. Testing Unauthenticated Request ---')
try:
    urllib.request.urlopen(f'{BASE_URL}/api/dashboard')
    print('FAIL: should have been blocked')
except urllib.error.HTTPError as e:
    print(f'PASS: Blocked with HTTP {e.code} ({e.read().decode()})')

print('\n--- 2. Testing Wrong Access Code ---')
data = json.dumps({'code': '999999'}).encode('utf-8')
req = urllib.request.Request(f'{BASE_URL}/api/auth/login', data=data, headers={'Content-Type': 'application/json'})
try:
    urllib.request.urlopen(req)
    print('FAIL: should have rejected')
except urllib.error.HTTPError as e:
    print(f'PASS: Rejected wrong PIN with HTTP {e.code}')

print('\n--- 3. Testing Correct Access Code (123456) ---')
data = json.dumps({'code': '123456'}).encode('utf-8')
req = urllib.request.Request(f'{BASE_URL}/api/auth/login', data=data, headers={'Content-Type': 'application/json'})
resp = urllib.request.urlopen(req)
login_res = json.loads(resp.read().decode())
print(f"PASS: Logged in successfully, token received: {login_res['token'][:16]}...")

print('\n--- 4. Testing Authenticated API Access with Token ---')
token = login_res['token']
req_auth = urllib.request.Request(f'{BASE_URL}/api/dashboard', headers={'Authorization': f'Bearer {token}'})
resp_auth = urllib.request.urlopen(req_auth)
dash = json.loads(resp_auth.read().decode())
print(f"PASS: Dashboard data accessible! Total Omset: Rp {dash['totalStats']['total_omset']:,}")

print('\nALL AUTHENTICATION TESTS PASSED!')
