function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type ExportColumn = { header: string; value: string };

export function rowsToExportMatrix(
  headers: string[],
  rows: Array<Array<string | number | boolean | null | undefined>>
): { headers: string[]; body: string[][] } {
  return {
    headers,
    body: rows.map((row) =>
      row.map((cell) => {
        if (cell == null) return '';
        return String(cell);
      })
    ),
  };
}

export function exportToCsv(filename: string, headers: string[], body: string[][]) {
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...body.map((row) => row.map(escapeCsvCell).join(',')),
  ];
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], {
    type: 'text/csv;charset=utf-8;',
  });
  downloadBlob(filename.endsWith('.csv') ? filename : `${filename}.csv`, blob);
}

/** SpreadsheetML (.xls) that Excel and Google Sheets open without extra deps. */
export function exportToExcel(filename: string, headers: string[], body: string[][]) {
  const headerXml = headers
    .map((h) => `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`)
    .join('');
  const rowXml = body
    .map((row) => {
      const cells = row
        .map((cell) => {
          const n = Number(cell);
          if (cell !== '' && Number.isFinite(n) && String(n) === cell.trim()) {
            return `<Cell><Data ss:Type="Number">${cell}</Data></Cell>`;
          }
          return `<Cell><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`;
        })
        .join('');
      return `<Row>${cells}</Row>`;
    })
    .join('');

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Sheet1">
  <Table>
   <Row>${headerXml}</Row>
   ${rowXml}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  downloadBlob(filename.endsWith('.xls') ? filename : `${filename}.xls`, blob);
}

/** Opens a print dialog so the operator can Save as PDF. */
export function exportToPdf(title: string, headers: string[], body: string[][]) {
  const headerHtml = headers.map((h) => `<th>${escapeXml(h)}</th>`).join('');
  const bodyHtml = body
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escapeXml(cell)}</td>`).join('')}</tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeXml(title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; color: #111; }
    h1 { font-size: 18px; margin: 0 0 16px; }
    table { border-collapse: collapse; width: 100%; font-size: 12px; }
    th, td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; }
    th { background: #f9fafb; font-weight: 600; }
  </style>
</head>
<body>
  <h1>${escapeXml(title)}</h1>
  <table>
    <thead><tr>${headerHtml}</tr></thead>
    <tbody>${bodyHtml}</tbody>
  </table>
  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) {
    throw new Error('Pop-up blocked. Allow pop-ups to export PDF.');
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
