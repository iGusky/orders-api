import { Fragment, type ReactNode } from 'react';

// Parser mínimo de markdown, suficiente para docs/styles.md. No es de uso general.

export type Block =
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: ListItem[] }
  | { kind: 'table'; header: string[]; rows: string[][] }
  | { kind: 'code'; text: string }
  | { kind: 'quote'; text: string };

export interface ListItem {
  text: string;
  children: string[];
}

export interface Section {
  key: string;      // "6.1", o "4/Radios" para subsecciones sin número
  level: 1 | 2 | 3;
  title: string;
  blocks: Block[];
}

const NUMBERED_TITLE = /^(\d+(?:\.\d+)?)\.?\s/;

export function parseSections(markdown: string): Section[] {
  const sections: Section[] = [];
  let current: Section = { key: 'intro', level: 1, title: '', blocks: [] };
  let parentKey = '';
  const lines = markdown.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);

    if (heading) {
      const level = heading[1].length as 1 | 2 | 3;
      const title = heading[2].trim();
      if (level === 1) {
        current.title = title;
        continue;
      }
      sections.push(current);
      const number = NUMBERED_TITLE.exec(title)?.[1];
      const key = number ?? `${parentKey}/${title}`;
      if (level === 2) parentKey = number ?? title;
      current = { key, level, title, blocks: [] };
      continue;
    }

    if (line.startsWith('```')) {
      const code: string[] = [];
      while (++i < lines.length && !lines[i].startsWith('```')) code.push(lines[i]);
      current.blocks.push({ kind: 'code', text: code.join('\n') });
      continue;
    }

    if (line.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('|')) tableLines.push(lines[i++]);
      i--;
      const [header, , ...rows] = tableLines.map(splitRow);
      current.blocks.push({ kind: 'table', header, rows });
      continue;
    }

    if (line.startsWith('>')) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) quote.push(lines[i++].replace(/^>\s?/, ''));
      i--;
      current.blocks.push({ kind: 'quote', text: quote.join(' ') });
      continue;
    }

    const listItem = /^(\s*)(?:-|\d+\.)\s+(.*)$/.exec(line);
    if (listItem) {
      const items: ListItem[] = [];
      while (i < lines.length && lines[i].trim() !== '') {
        const match = /^(\s*)(?:-|\d+\.)\s+(.*)$/.exec(lines[i]);
        const last = items[items.length - 1];
        if (match && match[1].length === 0) items.push({ text: match[2], children: [] });
        else if (match && last) last.children.push(match[2]);
        else if (last) {
          // Línea de continuación del renglón anterior
          if (last.children.length) last.children[last.children.length - 1] += ` ${lines[i].trim()}`;
          else last.text += ` ${lines[i].trim()}`;
        }
        i++;
      }
      i--;
      current.blocks.push({ kind: 'list', items });
      continue;
    }

    if (line.trim() === '' || line.trim() === '---') continue;

    const paragraph: string[] = [lines[i++].trim()];
    while (i < lines.length && lines[i].trim() !== '' && !/^(#|```|\||>|\s*-\s|\d+\.\s)/.test(lines[i])) {
      paragraph.push(lines[i++].trim());
    }
    i--;
    current.blocks.push({ kind: 'paragraph', text: paragraph.join(' ') });
  }

  sections.push(current);
  return sections;
}

function splitRow(row: string): string[] {
  return row
    .replace(/\\\|/g, '\uE000')
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.replace(/\uE000/g, '|').trim());
}

// Valores entre comillas invertidas de una celda o frase: "`a` y `b`" -> ["a", "b"]
export function codeSpans(text: string): string[] {
  return [...text.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
}

export function Inline({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((part, i) => {
        let node: ReactNode = part;
        if (part.startsWith('`')) {
          node = <code className="rounded-sm bg-line/50 px-1 text-[0.9em]">{part.slice(1, -1)}</code>;
        } else if (part.startsWith('**')) {
          node = <strong className="font-semibold"><Inline text={part.slice(2, -2)} /></strong>;
        } else if (part.startsWith('*') && part.length > 2) {
          node = <em><Inline text={part.slice(1, -1)} /></em>;
        } else if (part.startsWith('[')) {
          node = <span className="underline decoration-line">{/\[([^\]]+)\]/.exec(part)?.[1]}</span>;
        }
        return <Fragment key={i}>{node}</Fragment>;
      })}
    </>
  );
}
