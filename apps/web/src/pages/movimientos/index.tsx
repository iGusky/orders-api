import { NavLink, useSearchParams } from 'react-router';
import { History } from 'lucide-react';
import { EmptyState } from '../../components/EmptyState';
import { ErrorPanel } from '../../components/ErrorPanel';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';
import type { Movement } from '../../types/movement';
import { dayKey, formatDay, formatTime } from '../../utils/dates';
import { formatCents } from '../../utils/money';
import { MOVEMENT_TYPE_META, movementLabel } from '../../utils/movements';
import { useQuery } from '../../hooks/useQuery';
import { getMovements } from '../../services/api';

const PER_PAGE = 20;
const PAGE_PARAM = 'pagina';

interface DayGroup {
  key: string;
  label: string;
  movements: Movement[];
}

// La API ya ordena del más reciente al más antiguo, así que basta con cortar cuando cambia el día.
function groupByDay(movements: Movement[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const movement of movements) {
    const key = dayKey(movement.occurredAt);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.movements.push(movement);
    else groups.push({ key, label: formatDay(movement.occurredAt), movements: [movement] });
  }
  return groups;
}

// Una devolución es dinero que sale: se muestra con signo menos.
function MovementAmount({ movement }: { movement: Movement }) {
  if (movement.totalCents === 0) return null;
  const sign = movement.type === 'RETURN' ? '−' : '';
  return <span className="tabular font-semibold">{sign}{formatCents(movement.totalCents)}</span>;
}

function MovementIcon({ movement }: { movement: Movement }) {
  const Icon = MOVEMENT_TYPE_META[movement.type].icon;
  return <Icon className="size-5 shrink-0 text-ink-muted" aria-hidden />;
}

// Celular: lista agrupada por día
function MovementList({ groups }: { groups: DayGroup[] }) {
  return (
    <div className="flex flex-col gap-6 md:hidden">
      {groups.map((group) => (
        <section key={group.key} aria-labelledby={`dia-${group.key}`} className="flex flex-col gap-2">
          <h2 id={`dia-${group.key}`} className="font-sans text-base font-semibold">{group.label}</h2>
          <ul className="flex flex-col gap-2">
            {group.movements.map((movement) => (
              <li key={movement.id} className="flex min-h-16 items-center gap-3 rounded-md border border-line bg-surface px-4 py-2">
                <MovementIcon movement={movement} />
                <span className="flex flex-1 flex-col">
                  <span>{movementLabel(movement)}</span>
                  <span className="tabular text-sm text-ink-muted">{formatTime(movement.occurredAt)}</span>
                </span>
                <MovementAmount movement={movement} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

// iPad y escritorio: tabla agrupada por día
function MovementTable({ groups }: { groups: DayGroup[] }) {
  return (
    <div className="hidden overflow-hidden rounded-lg border border-line bg-surface md:block">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-line text-sm text-ink-muted">
            <th scope="col" className="px-5 py-3 font-normal">Tipo</th>
            <th scope="col" className="px-5 py-3 font-normal">Hora</th>
            <th scope="col" className="px-5 py-3 text-right font-normal">Importe</th>
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.key}>
            <tr className="bg-background/60">
              <th scope="colgroup" colSpan={3} className="px-5 py-2 font-semibold">{group.label}</th>
            </tr>
            {group.movements.map((movement) => (
              <tr key={movement.id} className="h-16 border-t border-line">
                <td className="px-5">
                  <span className="flex items-center gap-3">
                    <MovementIcon movement={movement} />
                    {movementLabel(movement)}
                  </span>
                </td>
                <td className="tabular px-5 text-ink-muted">{formatTime(movement.occurredAt)}</td>
                <td className="px-5 text-right"><MovementAmount movement={movement} /></td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="Cargando movimientos">
      <div className="h-6 w-32 animate-pulse rounded-sm bg-line/50" />
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-md bg-line/50" />
      ))}
    </div>
  );
}

function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

export function MovementsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get(PAGE_PARAM));
  const { status, data, refetch } = useQuery(`movements:${page}`, (signal) =>
    getMovements({ page, perPage: PER_PAGE }, { signal }),
  );

  const goToPage = (next: number) => {
    setSearchParams(next === 1 ? {} : { [PAGE_PARAM]: String(next) });
    window.scrollTo({ top: 0 });
  };


  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pt-safe pb-safe md:px-6">
      <PageHeader title="Movimientos">
        {data && data.totalItems > 0 && `${data.totalItems} ${data.totalItems === 1 ? 'movimiento' : 'movimientos'} en total`}
      </PageHeader>

      {status === 'loading' && !data && <LoadingRows />}

      {status === 'error' && (
        <ErrorPanel message="No se pudieron cargar los movimientos. Revisa tu conexión e inténtalo otra vez." onRetry={refetch} />
      )}

      {status !== 'error' && data && data.totalItems === 0 && (
        <EmptyState icon={History} message="Todavía no hay movimientos. Aparecerán aquí cuando registres una venta o agregues stock.">
          <NavLink to="/" className="grid h-touch-lg place-items-center rounded-md bg-primary px-5 text-lg font-semibold text-on-primary active:bg-primary-pressed">
            Ir al inicio
          </NavLink>
        </EmptyState>
      )}

      {status !== 'error' && data && data.totalItems > 0 && data.data.length === 0 && (
        <EmptyState icon={History} message={`La página ${page} no existe.`}>
          <button type="button" onClick={() => goToPage(1)} className="h-touch rounded-md border border-line bg-surface px-4 font-semibold active:bg-primary-soft">
            Ir a la primera página
          </button>
        </EmptyState>
      )}

      {status !== 'error' && data && data.data.length > 0 && (
        <div aria-busy={status === 'loading'} className={`flex flex-col gap-6 pb-6 ${status === 'loading' ? 'opacity-60' : ''}`}>
          <MovementList groups={groupByDay(data.data)} />
          <MovementTable groups={groupByDay(data.data)} />
          <Pagination page={page} totalPages={data.totalPages} onChange={goToPage} />
        </div>
      )}
    </main>
  );
}

export default MovementsPage;
