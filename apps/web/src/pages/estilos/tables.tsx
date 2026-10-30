import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import * as Lucide from 'lucide-react';
import { codeSpans, Inline, type ListItem } from './markdown';

// Se vuelve a renderizar cuando Vite reemplaza los estilos (HMR de styles.css).
export function useStylesVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const observer = new MutationObserver(() => setVersion((v) => v + 1));
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);
  return version;
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// ---------- Tablas ----------

type Preview = (row: string[], rows: string[][]) => ReactNode;

function choosePreview(header: string[]): Preview | undefined {
  const [first, second] = header;
  if (first.startsWith('Token')) return ColorPreview;
  if (first === 'Clase' && second === 'Familia') return FontPreview;
  if (first === 'Clase' && second === 'Tamaño') return SizePreview;
  if (first === 'Clase' && second === 'Radio') return RadiusPreview;
  if (first === 'Clase' && second === 'Medida') return TouchPreview;
  if (first === 'Variante' && second === 'Clases base') return ButtonPreview;
  if (header.includes('Icono lucide')) return (row) => <IconPreview name={codeSpans(row[header.indexOf('Icono lucide')])[0]} />;
  return undefined;
}

export function hasPreview(header: string[]) {
  return choosePreview(header) !== undefined;
}

export function TableBlock({ header, rows }: { header: string[]; rows: string[][] }) {
  const preview = choosePreview(header);
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line">
            {preview && <th className="p-3 font-semibold">Vista</th>}
            {header.map((cell) => (
              <th key={cell} className="p-3 font-semibold"><Inline text={cell} /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join()} className="border-b border-line last:border-b-0 align-middle">
              {preview && <td className="p-3">{preview(row, rows)}</td>}
              {row.map((cell, i) => (
                <td key={i} className="p-3"><Inline text={cell} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const ColorPreview: Preview = (row) => {
  const token = codeSpans(row[0])[0];
  const dark = document.documentElement.dataset.theme === 'dark';
  const documented = codeSpans(row[dark ? 2 : 1])[0]?.toLowerCase();
  const actual = cssVar(`--color-${token}`).toLowerCase();
  return (
    <div className="flex items-center gap-2">
      <span className="size-10 shrink-0 rounded-sm border border-line" style={{ background: `var(--color-${token})` }} />
      {!actual && <Mismatch>No existe en styles.css</Mismatch>}
      {actual && documented && actual !== documented && <Mismatch>En styles.css es {actual}</Mismatch>}
    </div>
  );
};

function Mismatch({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-center gap-1 text-danger">
      <Lucide.CircleAlert className="size-4 shrink-0" aria-hidden />
      {children}
    </span>
  );
}

const FontPreview: Preview = (row) => {
  const name = codeSpans(row[0])[0]?.replace('font-', '');
  return <span className="text-lg" style={{ fontFamily: `var(--font-${name})` }}>5 stickers en $45.00</span>;
};

const SizePreview: Preview = (row) => {
  const name = codeSpans(row[0])[0]?.replace('text-', '');
  return (
    <span className="whitespace-nowrap" style={{ fontSize: `var(--text-${name})`, lineHeight: `var(--text-${name}--line-height)` }}>
      Venta 1,250
    </span>
  );
};

const RadiusPreview: Preview = (row) => {
  const cls = codeSpans(row[0])[0] ?? '';
  const match = /^rounded(?:-([trbl]))?-(.+)$/.exec(cls);
  const radius = match ? `var(--radius-${match[2]})` : '0';
  const style: CSSProperties =
    match?.[1] === 't' ? { borderTopLeftRadius: radius, borderTopRightRadius: radius } : { borderRadius: radius };
  return <span className="block h-12 w-20 border-2 border-primary bg-primary-soft" style={style} />;
};

const TouchPreview: Preview = (row) => {
  const token = codeSpans(row[0])[0]?.replace(/^(min-h-|h-|size-)/, '');
  const size = `var(--spacing-${token})`;
  return <span className="block rounded-sm border-2 border-dashed border-primary bg-primary-soft" style={{ width: size, height: size }} />;
};

// "Igual que secundario con `text-danger`" toma las clases de la fila "Secundario" y agrega las nuevas.
const ButtonPreview: Preview = (row, rows) => {
  const [variant, base] = row;
  let classes = codeSpans(base).join(' ');
  const inherits = /igual que (\w+)/i.exec(base)?.[1];
  if (inherits) {
    const parent = rows.find((r) => r[0].toLowerCase() === inherits.toLowerCase());
    classes = `${parent ? codeSpans(parent[1]).join(' ') : ''} ${classes}`;
  }
  if (classes.includes('size-touch')) {
    return (
      <button type="button" className={classes} aria-label="Cerrar">
        <Lucide.X className="size-6" aria-hidden />
      </button>
    );
  }
  return <button type="button" className={`whitespace-nowrap ${classes}`}>{variant}</button>;
};

function IconPreview({ name }: { name?: string }) {
  const Icon = name ? (Lucide as unknown as Record<string, Lucide.LucideIcon | undefined>)[name] : undefined;
  if (!Icon) return <Mismatch>No existe en lucide</Mismatch>;
  return <Icon className="size-6" aria-hidden />;
}

// ---------- Contraste ----------

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

// Lee frases como "`ink` sobre `background`, `surface` y `kraft`." y calcula el contraste real de cada par.
function contrastPairs(items: ListItem[]) {
  return items.flatMap((item) => {
    const sentence = item.text.split(/\.\s/)[0];
    if (!sentence.includes(' sobre ')) return [];
    const [fgPart, bgPart] = sentence.split(' sobre ');
    return codeSpans(fgPart).flatMap((fg) => codeSpans(bgPart).map((bg) => [fg, bg] as const));
  }).filter(([fg, bg]) => cssVar(`--color-${fg}`) && cssVar(`--color-${bg}`));
}

export function hasContrastPairs(items: ListItem[]) {
  return contrastPairs(items).length > 0;
}

export function ContrastChecks({ items }: { items: ListItem[] }) {
  const pairs = contrastPairs(items);
  if (pairs.length === 0) return null;

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3">
      {pairs.map(([fg, bg]) => {
        const fgHex = cssVar(`--color-${fg}`);
        const bgHex = cssVar(`--color-${bg}`);
        const ratio = fgHex && bgHex ? contrast(fgHex, bgHex) : 0;
        const passes = ratio >= 4.5;
        return (
          <div key={fg + bg} className="rounded-md border border-line p-3" style={{ background: `var(--color-${bg})`, color: `var(--color-${fg})` }}>
            <p className="font-display text-lg">$45.00</p>
            <p className="text-sm">{fg} / {bg}</p>
            <p className="mt-2 flex items-center gap-1 text-sm font-semibold">
              {passes ? <Lucide.Check className="size-4" aria-hidden /> : <Lucide.CircleAlert className="size-4" aria-hidden />}
              {ratio.toFixed(2)}:1 {passes ? 'AA' : 'no pasa AA'}
            </p>
          </div>
        );
      })}
    </div>
  );
}
