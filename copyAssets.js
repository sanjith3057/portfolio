import fs from 'fs';
import path from 'path';

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
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
}

// Copy images
const imgDest = path.join(process.cwd(), 'sanjith-portfolio', 'public', 'images');
if (!fs.existsSync(imgDest)) {
  fs.mkdirSync(imgDest, { recursive: true });
}
const imgMap = {
  'Icon.png': 'robot-icon.png',
  'Thinking.png': 'robot-thinking.png',
  'Answer.png': 'robot-answer.png'
};

for (const [srcName, destName] of Object.entries(imgMap)) {
  const srcPath = path.join(process.cwd(), 'asserts', srcName);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, path.join(imgDest, destName));
    console.log(`Copied ${srcName} to ${destName}`);
  }
}

// Copy certificates
const certSrc = path.join(process.cwd(), 'Certificate');
const certDest = path.join(process.cwd(), 'sanjith-portfolio', 'public', 'Certificate');
if (fs.existsSync(certSrc)) {
  copyDir(certSrc, certDest);
  console.log('Copied certificates to public/Certificate');
}
