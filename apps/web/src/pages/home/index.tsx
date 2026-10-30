import { NavLink } from 'react-router';
import { Boxes, ChevronRight, History, PackagePlus, ShoppingBag, type LucideIcon } from 'lucide-react';

interface MenuLinkProps {
  to: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

function MenuLink({ to, icon: Icon, children }: MenuLinkProps) {
  return (
    <NavLink
      to={to}
      end
      className="flex min-h-16 items-center gap-4 rounded-md border border-line bg-surface px-4 text-lg active:bg-primary-soft"
    >
      <Icon className="size-6 shrink-0 text-ink-muted" aria-hidden />
      <span className="flex-1">{children}</span>
      <ChevronRight className="size-5 text-ink-muted" aria-hidden />
    </NavLink>
  );
}

export function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pt-safe pb-safe">
      <h1 className="mt-8 text-2xl">Registro de ventas</h1>

      <NavLink
        to="/registrar-venta"
        end
        className="flex min-h-40 flex-col justify-between rounded-lg bg-primary p-5 text-on-primary active:bg-primary-pressed"
      >
        <ShoppingBag className="size-8" aria-hidden />
        <span className="font-display text-xl">Registrar venta</span>
      </NavLink>

      <nav aria-label="Secciones" className="flex flex-col gap-3">
        <MenuLink to="/agregar-stock" icon={PackagePlus}>Agregar stock</MenuLink>
        <MenuLink to="/movimientos" icon={History}>Movimientos</MenuLink>
        <MenuLink to="/inventario" icon={Boxes}>Inventario</MenuLink>
      </nav>
    </main>
  );
}

export default Home;
