import urllib.request
import json

BASE_URL = 'http://localhost:5000'

# 1. Test Dashboard
print('--- 1. Testing /api/dashboard ---')
req = urllib.request.urlopen(f'{BASE_URL}/api/dashboard')
dash = json.loads(req.read().decode())
print(f"Total Invoices: {dash['totalStats']['total_invoices']}, Total Omset: Rp {dash['totalStats']['total_omset']:,}, Total Laba: Rp {dash['totalStats']['total_laba']:,}")

# 2. Test Customer Price Lookup
print('\n--- 2. Testing Customer Price Lookup for Product 1 (54RYA KARDUS) and Customer 8 (SIM) ---')
req = urllib.request.urlopen(f'{BASE_URL}/api/pricing-matrix/lookup?product_id=1&customer_id=8')
lookup = json.loads(req.read().decode())
print(f"Price for SIM: Rp {lookup['sell_price']:,} (Modal: Rp {lookup['modal_price']:,})")

# 3. Test Checkout (Post new transaction)
print('\n--- 3. Testing POST /api/invoices ---')
post_data = {
    'date': '2026-08-25',
    'customer_id': 8, # SIM
    'customer_name_manual': 'SIMO',
    'notes': 'Test transaksi otomatis',
    'items': [
        {
            'product_id': 1, # 54RYA KARDUS
            'qty': 2,
            'unit_price': lookup['sell_price'],
            'subtotal': lookup['sell_price'] * 2
        }
    ]
}
data_bytes = json.dumps(post_data).encode('utf-8')
req_post = urllib.request.Request(f'{BASE_URL}/api/invoices', data=data_bytes, headers={'Content-Type': 'application/json'})
resp_post = urllib.request.urlopen(req_post)
post_res = json.loads(resp_post.read().decode())
print(f"Invoice Created: {post_res['invoice_no']} (ID: {post_res['id']})")

# 4. Verify Invoice Detail
req_inv = urllib.request.urlopen(f"{BASE_URL}/api/invoices/{post_res['id']}")
inv_detail = json.loads(req_inv.read().decode())
print(f"Invoice Detail: Total = Rp {inv_detail['total_amount']:,}, Items = {len(inv_detail['items'])}")

# 5. Check Updated Stock
req_stock = urllib.request.urlopen(f'{BASE_URL}/api/stocks')
stocks = json.loads(req_stock.read().decode())
prod1_stock = next(s for s in stocks if s['product_id'] == 1)
print(f"Product 1 Stock after sale: Out = {prod1_stock['stok_out']}, Akhir = {prod1_stock['stok_akhir']}")

# 6. Test Excel Export
print('\n--- 4. Testing /api/export/excel ---')
req_excel = urllib.request.urlopen(f'{BASE_URL}/api/export/excel')
excel_bytes = req_excel.read()
print(f"Excel Export successful: {len(excel_bytes)} bytes downloaded")

print('\nALL AUTOMATED API TESTS PASSED SUCCESSFULLY!')
