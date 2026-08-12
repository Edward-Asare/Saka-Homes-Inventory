export function downloadCsv(filename, rows) {
  if (!rows?.length) return;

  const headers = Object.keys(rows[0]);
  const escape = (value) => {
    const str = value == null ? '' : String(value);
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };

  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((key) => escape(row[key])).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function printReport(title, htmlBody) {
  const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
  if (!win) return;

  win.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: DM Sans, Arial, sans-serif; color: #0f1419; padding: 32px; }
    h1 { font-size: 22px; margin: 0 0 8px; }
    p.meta { color: #64748b; font-size: 12px; margin: 0 0 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #e8eaef; padding: 8px; text-align: left; }
    th { background: #f7f8fa; }
    .section { margin-top: 28px; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="meta">Saka Homes Inventory · Generated ${new Date().toLocaleString('en-GH')}</p>
  ${htmlBody}
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`);
  win.document.close();
}
