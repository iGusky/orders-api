import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

// El icono muestra el tema al que se cambia.
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const Icon = theme === 'dark' ? Sun : Moon;
  return (
    <button
      type="button"
      aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      className="grid size-touch shrink-0 place-items-center rounded-full active:bg-primary-soft"
      onClick={toggleTheme}
    >
      <Icon className="size-6" aria-hidden />
    </button>
  );
}
