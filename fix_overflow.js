const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('page.tsx')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const files = walkSync('src/app/dashboard');

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  // Replace <div className="... overflow-hidden ..."> right before <table ...>
  // A simple regex might be tricky. Let's just look for <div className="... overflow-hidden"> exactly where it wraps a table.
  // Actually, replacing all `overflow-hidden` with `overflow-x-auto` on divs that contain `table` is best.
  
  // Let's just do a string replace for the known exact strings
  const exactStrings = [
    '<div className="w-full bg-white border border-[#e4e7ec] rounded-lg overflow-hidden">',
    '<div className="w-full overflow-hidden">',
    '<div className="bg-white border border-[#e4e7ec] rounded-lg overflow-hidden flex flex-col">',
    '<div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">'
  ];
  
  let modified = false;
  exactStrings.forEach(str => {
    if (content.includes(str)) {
      const rep = str.replace('overflow-hidden', 'overflow-x-auto overflow-y-hidden');
      // Actually overflow-y-hidden is not needed, overflow-x-auto implies overflow-y-hidden if we don't set height
      content = content.split(str).join(str.replace('overflow-hidden', 'overflow-x-auto'));
      modified = true;
    }
  });
  
  // also look for `<div className="w-full overflow-hidden">\n            <table`
  content = content.replace(/className="w-full overflow-hidden">\s*<table/g, 'className="w-full overflow-x-auto">\n            <table');
  
  if (modified || content.includes('className="w-full overflow-x-auto">\n            <table')) {
    fs.writeFileSync(f, content);
    console.log('Fixed tables in', f);
  }
});
