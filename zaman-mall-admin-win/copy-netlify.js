import fs from 'fs';
import path from 'path';

const copyDir = (src, dest) => {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
};

try {
  // Copy netlify.toml and modify publish directory
  if (fs.existsSync('netlify.toml')) {
    let tomlContent = fs.readFileSync('netlify.toml', 'utf8');
    // For drag-and-drop, the publish directory is the root of the drop (.)
    tomlContent = tomlContent.replace(/publish\s*=\s*"dist"/, 'publish = "."');
    fs.writeFileSync('dist/netlify.toml', tomlContent);
    console.log('✅ Copied netlify.toml to dist/ (with updated publish path)');
  }

  // Copy netlify/functions
  if (fs.existsSync('netlify')) {
    copyDir('netlify', 'dist/netlify');
    console.log('✅ Copied netlify/ folder to dist/');
  }
} catch (e) {
  console.error('Error copying files:', e);
}
