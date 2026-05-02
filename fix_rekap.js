const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/rekap-harian/page.tsx', 'utf8');
c = c.replace(
  'const handleExportExcel = () => {',
  'const handleExportExcel = async () => {'
);
c = c.replace(
  'if (!data || data.transactions.length === 0) return;\r\n\r\n const rows: any[] = [];',
  'if (!data || data.transactions.length === 0) return;\r\n\r\n const XLSX = await import("xlsx");\r\n const rows: any[] = [];'
);
c = c.replace(
  'if (!data || data.transactions.length === 0) return;\n\n const rows: any[] = [];',
  'if (!data || data.transactions.length === 0) return;\n\n const XLSX = await import("xlsx");\n const rows: any[] = [];'
);

fs.writeFileSync('src/app/dashboard/rekap-harian/page.tsx', c);
console.log("Fixed rekap-harian");
