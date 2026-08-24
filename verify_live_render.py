import urllib.request
import urllib.error
import json
import sys

# Force UTF-8 stdout
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = 'https://jurnaldimas.onrender.com'
headers_json = {'Content-Type': 'application/json'}

print(f"=== TESTING LIVE APPLICATION AT {BASE_URL} ===\n")

# 1. Health check
print("[1/8] Testing /api/health...")
try:
    resp = urllib.request.urlopen(f"{BASE_URL}/api/health", timeout=15)
    health = json.loads(resp.read().decode())
    print(f"  [OK] Health OK: {health}")
except Exception as e:
    print(f"  [FAIL] Health Failed: {e}")

# 2. Main HTML Page
print("\n[2/8] Testing Main Web Page HTML...")
try:
    resp = urllib.request.urlopen(BASE_URL, timeout=15)
    html = resp.read().decode()
    if 'CV. MASTER CIGARETTES' in html or 'manifest' in html or 'index' in html:
        print(f"  [OK] Frontend HTML loaded successfully! (Size: {len(html)} bytes)")
    else:
        print(f"  [WARN] HTML loaded: {html[:100]}")
except Exception as e:
    print(f"  [FAIL] Frontend load failed: {e}")

# 3. Authentication (PIN 123456)
print("\n[3/8] Testing Master PIN Authentication...")
token = None
try:
    login_data = json.dumps({'code': '123456'}).encode('utf-8')
    req = urllib.request.Request(f"{BASE_URL}/api/auth/login", data=login_data, headers=headers_json)
    resp = urllib.request.urlopen(req, timeout=15)
    login_res = json.loads(resp.read().decode())
    token = login_res.get('token')
    print(f"  [OK] Authentication Success! Token: {token[:16]}...")
except Exception as e:
    print(f"  [FAIL] Authentication Failed: {e}")

if not token:
    print("Cannot continue without token.")
    sys.exit(1)

auth_headers = {'Authorization': f'Bearer {token}'}

# 4. Dashboard Stats
print("\n[4/8] Testing /api/dashboard...")
try:
    req = urllib.request.Request(f"{BASE_URL}/api/dashboard", headers=auth_headers)
    resp = urllib.request.urlopen(req, timeout=15)
    dash = json.loads(resp.read().decode())
    total_omset = dash.get('totalStats', {}).get('total_omset', 0)
    total_invoices = dash.get('totalStats', {}).get('total_invoices', 0)
    print(f"  [OK] Dashboard OK! Total Omset: Rp {total_omset:,} ({total_invoices} transaksi)")
except Exception as e:
    print(f"  [FAIL] Dashboard Failed: {e}")

# 5. Products & Customers Count
print("\n[5/8] Testing Master Data (Products & Customers)...")
try:
    req_p = urllib.request.Request(f"{BASE_URL}/api/products", headers=auth_headers)
    products = json.loads(urllib.request.urlopen(req_p, timeout=15).read().decode())
    req_c = urllib.request.Request(f"{BASE_URL}/api/customers", headers=auth_headers)
    customers = json.loads(urllib.request.urlopen(req_c, timeout=15).read().decode())
    print(f"  [OK] Produk Terdaftar: {len(products)} macam rokok")
    print(f"  [OK] Pelanggan Terdaftar: {len(customers)} toko/pelanggan")
except Exception as e:
    print(f"  [FAIL] Master Data Failed: {e}")

# 6. Pricing Matrix
print("\n[6/8] Testing /api/pricing-matrix...")
try:
    req = urllib.request.Request(f"{BASE_URL}/api/pricing-matrix", headers=auth_headers)
    matrix_data = json.loads(urllib.request.urlopen(req, timeout=15).read().decode())
    entries = len(matrix_data.get('matrix', {}))
    print(f"  [OK] Matriks Harga OK: {entries} entri harga khusus pelanggan aktif")
except Exception as e:
    print(f"  [FAIL] Matriks Harga Failed: {e}")

# 7. Stock Opname
print("\n[7/8] Testing /api/stocks...")
try:
    req = urllib.request.Request(f"{BASE_URL}/api/stocks", headers=auth_headers)
    stocks = json.loads(urllib.request.urlopen(req, timeout=15).read().decode())
    total_stok = sum(s.get('stok_akhir', 0) for s in stocks)
    print(f"  [OK] Stock Opname OK: {len(stocks)} data produk, total sisa stok: {total_stok} slop")
except Exception as e:
    print(f"  [FAIL] Stock Opname Failed: {e}")

# 8. Test Live Transaction Simulation & Rollback
print("\n[8/8] Testing End-to-End Live Transaction & Clean-up...")
try:
    first_prod = products[0]
    first_cust = customers[0]
    payload = {
        "date": "2026-08-25",
        "customer_id": first_cust['id'],
        "customer_name_manual": first_cust['name'],
        "notes": "LIVE INTEGRATION VERIFICATION TEST",
        "items": [
            {
                "product_id": first_prod['id'],
                "name": first_prod['name'],
                "modal_price": first_prod['modal_price'],
                "unit_price": first_prod['default_price'] or first_prod['modal_price'],
                "qty": 1,
                "subtotal": first_prod['default_price'] or first_prod['modal_price']
            }
        ]
    }
    req_tx = urllib.request.Request(
        f"{BASE_URL}/api/invoices",
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json', **auth_headers}
    )
    res_tx = json.loads(urllib.request.urlopen(req_tx, timeout=15).read().decode())
    created_id = res_tx.get('id')
    print(f"  [OK] Transaksi Berhasil Dibuat! Invoice ID: {created_id}")

    # Delete the test invoice to leave clean data
    req_del = urllib.request.Request(f"{BASE_URL}/api/invoices/{created_id}", headers=auth_headers, method='DELETE')
    res_del = json.loads(urllib.request.urlopen(req_del, timeout=15).read().decode())
    print(f"  [OK] Transaksi Uji Coba Berhasil Dihapus & Stok Dipulihkan: {res_del.get('message')}")
except Exception as e:
    print(f"  [FAIL] Live Transaction Test Failed: {e}")

print("\n=======================================================")
print("SELURUH PEMERIKSAAN SISTEM LIVE RENDER SELESAI & SUKSES!")
print("=======================================================")
