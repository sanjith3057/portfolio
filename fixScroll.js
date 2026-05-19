import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'sanjith-portfolio', 'src', 'Portfolio.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all occurrences of viewport={{ once: true }} with viewport={{ once: false, amount: 0.1 }}
// We add amount: 0.1 so it triggers when 10% is visible, making it feel more natural when scrolling up and down.
content = content.replace(/viewport=\{\{\s*once:\s*true\s*\}\}/g, 'viewport={{ once: false, amount: 0.1 }}');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Scroll animations updated to trigger every time!');
