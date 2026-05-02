/**
 * Simple CSV generator - avoids dependency on json2csv types
 */
export function toCSV(data: Record<string, unknown>[], fields: string[]): string {
  const header = fields.join(',');
  const rows = data.map((row) =>
    fields
      .map((field) => {
        const value = row[field];
        if (value === null || value === undefined) return '';
        const str = String(value);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(',')
  );
  return [header, ...rows].join('\n');
}
