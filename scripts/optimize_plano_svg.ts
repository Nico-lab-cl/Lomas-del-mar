import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function sha256_16(buf: Buffer) {
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function main() {
  const svgPath = path.join(process.cwd(), 'public', 'plano.svg');
  const outDir = path.join(process.cwd(), 'public', 'plano-assets');

  if (!fs.existsSync(svgPath)) {
    throw new Error(`Missing file: ${svgPath}`);
  }

  let svg = fs.readFileSync(svgPath, 'utf8');

  const xmlIdx = svg.indexOf('<?xml');
  if (xmlIdx > 0) {
    svg = svg.slice(xmlIdx);
  }

  ensureDir(outDir);

  svg = svg.replaceAll('xlink:href="data:image/png;base64,plano-assets/', 'xlink:href="plano-assets/');

  let replaced = 0;
  svg = svg.replace(
    /xlink:href="data:image\/png;base64,([^"]+)"/g,
    (_m, b64: string) => {
      const buf = Buffer.from(b64, 'base64');
      if (!buf.length) {
        return 'xlink:href="plano-assets/plano-empty.png"';
      }

      const hash = sha256_16(buf);
      const fileName = `plano-${hash}.png`;
      const outPath = path.join(outDir, fileName);

      if (!fs.existsSync(outPath)) {
        fs.writeFileSync(outPath, buf);
      }

      replaced += 1;
      return `xlink:href="plano-assets/${fileName}"`;
    }
  );

  for (const f of fs.readdirSync(outDir)) {
    if (!f.toLowerCase().endsWith('.png')) continue;
    const p = path.join(outDir, f);
    try {
      const st = fs.statSync(p);
      if (st.size === 0) fs.unlinkSync(p);
    } catch {
      // ignore
    }
  }

  fs.writeFileSync(svgPath, svg, 'utf8');

  if (!svg.startsWith('<?xml')) {
    throw new Error('SVG header is still invalid (does not start with <?xml)');
  }

  console.log(`OK. replaced_base64_images=${replaced}`);
}

main();
