
import fs from 'fs';
import path from 'path';

function findKeys(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            findKeys(fullPath);
        } else if (fullPath.endsWith('.tsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const matches = content.match(/key=\{([^}]+)\}/g);
            if (matches) {
                matches.forEach(m => {
                    const val = m.match(/key=\{([^}]+)\}/)[1];
                    if (!val.includes('`') && !val.includes("'") && !val.includes('"') && !val.includes('idx') && !val.includes('globalIdx') && !val.includes('i') && !val.includes('index')) {
                         console.log(`${fullPath}: ${m}`);
                    }
                });
            }
        }
    }
}

findKeys('src');
