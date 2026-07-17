// Generic CSV export helper.
// columns: [{ header: 'Name', accessor: 'name' | (row) => value }]
export const exportToCsv = (filename, rows, columns) => {
  if (!rows || rows.length === 0) return false;

  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const s = String(val).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };

  const headerLine = columns.map((c) => escape(c.header)).join(',');
  const dataLines = rows.map((row) =>
    columns
      .map((c) => escape(typeof c.accessor === 'function' ? c.accessor(row) : row[c.accessor]))
      .join(',')
  );

  const csv = [headerLine, ...dataLines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
};
