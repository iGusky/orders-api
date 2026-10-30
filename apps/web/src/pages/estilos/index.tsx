/*
 * Pantalla TEMPORAL para visualizar docs/styles.md. Solo existe en desarrollo (/estilos).
 *
 * Para eliminarla:
 *   1. Borra la carpeta src/pages/estilos.
 *   2. Quita la ruta /estilos y el lazy import de StyleGuide en src/main.tsx.
 *   3. Quita la línea `@source "../docs/styles.md"` de src/styles.css.
 *   4. Quita la mención en apps/web/CLAUDE.md.
 */
import { NavLink } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import styleGuide from '../../../docs/styles.md?raw';
import { Inline, parseSections, type Block, type Section } from './markdown';
import { ContrastChecks, hasContrastPairs, hasPreview, TableBlock, useStylesVersion } from './tables';
import { demos } from './demos';

function sectionId(section: Section) {
  return `seccion-${section.key.replace(/[^\w.-]+/g, '-')}`;
}

function hasVisual(section: Section) {
  return (
    section.key in demos ||
    section.blocks.some((b) => (b.kind === 'table' && hasPreview(b.header)) || (b.kind === 'list' && hasContrastPairs(b.items)))
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'paragraph':
      return <p className="max-w-prose"><Inline text={block.text} /></p>;
    case 'quote':
      return <p className="max-w-prose border-l-4 border-line pl-4 text-ink-muted"><Inline text={block.text} /></p>;
    case 'code':
      return <pre className="overflow-x-auto rounded-md bg-surface p-4 text-sm leading-snug">{block.text}</pre>;
    case 'table':
      return <TableBlock header={block.header} rows={block.rows} />;
    case 'list':
      return (
        <div className="flex flex-col gap-4">
          <ul className="flex max-w-prose list-disc flex-col gap-2 pl-5">
            {block.items.map((item) => (
              <li key={item.text}>
                <Inline text={item.text} />
                {item.children.length > 0 && (
                  <ul className="mt-1 flex list-[circle] flex-col gap-1 pl-5">
                    {item.children.map((child) => <li key={child}><Inline text={child} /></li>)}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <ContrastChecks items={block.items} />
        </div>
      );
  }
}

function SectionView({ section }: { section: Section }) {
  const Demo = demos[section.key];
  const Heading = section.level === 2 ? 'h2' : 'h3';
  return (
    <section id={sectionId(section)} className="flex scroll-mt-4 flex-col gap-4">
      <Heading className={section.level === 2 ? 'mt-6 text-2xl' : 'mt-2 text-xl'}><Inline text={section.title} /></Heading>
      {section.blocks.map((block, i) => <BlockView key={i} block={block} />)}
      {Demo && <Demo />}
    </section>
  );
}

export function StyleGuide() {
  useStylesVersion();
  const sections = parseSections(styleGuide);
  const [intro, ...rest] = sections;
  const unknownDemos = Object.keys(demos).filter((key) => !sections.some((s) => s.key === key));

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pt-safe pb-24 md:px-6">
      <header className="mt-4 flex flex-col gap-3">
        <NavLink to="/" className="flex min-h-touch w-fit items-center gap-1 rounded-md pr-3 text-ink-muted active:bg-primary-soft">
          <ChevronLeft className="size-6" aria-hidden />
          Inicio
        </NavLink>
        <h1 className="text-2xl">{intro.title}</h1>
        <p className="max-w-prose rounded-md bg-kraft p-4 text-sm">
          Pantalla temporal, solo en desarrollo. El texto y las tablas se leen de <code>docs/styles.md</code> y las vistas usan
          los tokens reales de <code>src/styles.css</code>: al guardar cualquiera de los dos, esta página se actualiza.
          Los demos interactivos están en <code>src/pages/estilos/demos.tsx</code>.
        </p>
        {intro.blocks.map((block, i) => <BlockView key={i} block={block} />)}
      </header>

      {unknownDemos.length > 0 && (
        <p className="rounded-md bg-danger-soft p-4 text-sm">
          Hay demos para secciones que ya no existen en el documento: {unknownDemos.join(', ')}. Actualiza las claves en demos.tsx.
        </p>
      )}

      <nav aria-label="Contenido" className="rounded-lg border border-line bg-surface p-4">
        <ul className="grid gap-1 sm:grid-cols-2">
          {rest.map((section) => (
            <li key={section.key} className={section.level === 3 ? 'pl-4' : ''}>
              <a href={`#${sectionId(section)}`} className="flex min-h-touch items-center justify-between gap-2 rounded-md px-2 active:bg-primary-soft">
                <span className={section.level === 2 ? 'font-semibold' : 'text-ink-muted'}><Inline text={section.title} /></span>
                {!hasVisual(section) && <span className="shrink-0 text-sm text-ink-muted">Solo texto</span>}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {rest.map((section) => <SectionView key={section.key} section={section} />)}
    </main>
  );
}

export default StyleGuide;
