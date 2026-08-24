export function formatRupiah(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0';
  return 'Rp ' + Number(amount).toLocaleString('id-ID');
}

export function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function generateWhatsAppMessage(invoice) {
  let text = `*CV. MASTER CIGARETTES*\n`;
  text += `*NOTA PENJUALAN*\n`;
  text += `--------------------------------\n`;
  text += `No. Nota: ${invoice.invoice_no}\n`;
  text += `Tanggal : ${formatDate(invoice.date)}\n`;
  text += `Pelanggan: ${invoice.customer_name || invoice.customer_code || 'Umum'} (${invoice.customer_code || '-'})\n`;
  text += `--------------------------------\n`;
  
  if (invoice.items && invoice.items.length > 0) {
    invoice.items.forEach((item, idx) => {
      text += `${idx + 1}. ${item.product_name || item.name}\n`;
      text += `   ${item.qty} x ${formatRupiah(item.unit_price)} = *${formatRupiah(item.subtotal)}*\n`;
    });
  }
  
  text += `--------------------------------\n`;
  text += `*TOTAL BAYAR: ${formatRupiah(invoice.total_amount)}*\n`;
  text += `--------------------------------\n`;
  text += `_Terima kasih atas kerja samanya!_`;

  return encodeURIComponent(text);
}
