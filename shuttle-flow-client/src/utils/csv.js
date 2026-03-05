export function downloadCsv(filename, rows) {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

function toCsv(rows) {
  if (!rows || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];

  for (const r of rows) {
    const line = headers
      .map((h) => escapeCsv(String(r[h] ?? "")))
      .join(",");
    lines.push(line);
  }

  return lines.join("\n");
}

function escapeCsv(value) {
  const needsQuotes = /[",\n]/.test(value);
  const v = value.replaceAll('"', '""');
  return needsQuotes ? `"${v}"` : v;
}