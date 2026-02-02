const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/lots.json');

try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const lots = JSON.parse(raw);

    let fixedCount = 0;
    const fixedLots = lots.map(lot => {
        const correctId = parseInt(lot.number, 10);
        // If ID is a timestamp (e.g. > 10000) or doesn't match number, fix it
        if (lot.id > 10000 || lot.id !== correctId) {
            if (!isNaN(correctId)) {
                lot.id = correctId;
                fixedCount++;
            }
        }
        return lot;
    });

    fs.writeFileSync(filePath, JSON.stringify(fixedLots, null, 4), 'utf8');
    console.log(`✅ Fixed ${fixedCount} lots in ${filePath}`);

} catch (e) {
    console.error('Error fixing lots.json:', e);
}
