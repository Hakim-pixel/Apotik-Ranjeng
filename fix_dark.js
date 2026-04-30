const fs = require('fs');
const files = [
  'src/app/dashboard/laporan/page.tsx',
  'src/app/dashboard/rekap-harian/page.tsx',
  'src/app/dashboard/users/page.tsx'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/dark:[^\s\"\'\`\}]+/g, '');
  // Clean up double spaces left by removing classes
  content = content.replace(/  +/g, ' ');
  fs.writeFileSync(f, content);
  console.log('Fixed', f);
});
