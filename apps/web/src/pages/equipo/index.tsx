import { useCallback, useState } from 'react';
import { Navigate } from 'react-router';
import { CircleAlert, Loader2, Users } from 'lucide-react';
import { useCurrentStore, useCurrentUser } from '../../auth/AuthContext';
import { BottomSheet } from '../../components/BottomSheet';
import { EmptyState } from '../../components/EmptyState';
import { ErrorPanel } from '../../components/ErrorPanel';
import { PageHeader } from '../../components/PageHeader';
import { Toast } from '../../components/Toast';
import { useQuery } from '../../hooks/useQuery';
import { getDomainError, getTeam, removeMember, revokeInvitation } from '../../services/api';
import type { AddMemberResult, StoreInvitation, TeamMember } from '../../types/member';
import { failedMessage } from '../../utils/requestErrors';
import { AddMemberForm } from './AddMemberForm';
import { InvitationRow, MemberRow } from './TeamRows';

// Lo que se va a quitar, mientras se confirma.
type PendingRemoval = { kind: 'member'; member: TeamMember } | { kind: 'invitation'; invitation: StoreInvitation };

function LoadingRows() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="Cargando el equipo">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-md bg-line/50" />
      ))}
    </div>
  );
}

function addedMessage(result: AddMemberResult): string {
  return result.status === 'ADDED'
    ? `${result.member.name} ya tiene acceso a tu tienda.`
    : `Listo. ${result.invitation.email} tendrá acceso en cuanto entre a la app.`;
}

interface ConfirmRemovalProps {
  removal: PendingRemoval | null;
  storeName: string;
  onClose: () => void;
  onRemoved: (message: string) => void;
}

// Confirmación antes de quitar acceso (RF4). Si ya no estaba (lo quitaron desde otro dispositivo), se da por hecho.
function ConfirmRemoval({ removal, storeName, onClose, onRemoved }: ConfirmRemovalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (saving) return;
    setError(null);
    onClose();
  };

  if (!removal) return null;

  const isMember = removal.kind === 'member';
  const who = isMember ? removal.member.name : removal.invitation.email;

  const confirm = async () => {
    setSaving(true);
    setError(null);
    try {
      if (isMember) await removeMember(removal.member.userId);
      else await revokeInvitation(removal.invitation.id);
      onRemoved(isMember ? `${who} ya no tiene acceso.` : `Cancelaste el acceso de ${who}.`);
    } catch (e) {
      const code = getDomainError(e)?.errorCode;
      if (code === 'MEMBER_NOT_FOUND' || code === 'INVITATION_NOT_FOUND') onRemoved(`${who} ya no tenía acceso.`);
      else setError(failedMessage(isMember ? 'No se pudo quitar a esa persona.' : 'No se pudo cancelar el acceso.', e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet open title={isMember ? `¿Quitar a ${who}?` : '¿Cancelar el acceso?'} onClose={close}>
      <div className="flex flex-col gap-4">
        <p>
          {isMember
            ? `Ya no podrá registrar ventas ni movimientos en ${storeName}. Lo que ya registró se conserva.`
            : `${who} no tendrá acceso a ${storeName} cuando entre a la app.`}
        </p>
        {error && (
          <p role="alert" className="flex gap-2 rounded-md bg-danger-soft p-3 text-sm">
            <CircleAlert className="size-5 shrink-0 text-danger" aria-hidden />
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
          <button
            type="button"
            onClick={close}
            className="h-touch rounded-md border border-line bg-surface px-4 font-semibold active:bg-primary-soft"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={saving}
            className="flex h-touch items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 font-semibold text-danger active:bg-danger-soft disabled:opacity-50"
          >
            {saving && <Loader2 className="size-5 animate-spin" aria-hidden />}
            {isMember ? 'Quitar acceso' : 'Cancelar acceso'}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

// Equipo de la tienda activa (RF1, RF3, RF4). Solo para el dueño (D30): un empleado vuelve al inicio.
export function TeamPage() {
  const store = useCurrentStore();
  const user = useCurrentUser();
  const { data, status, error, refetch } = useQuery(`team:${store.id}`, (signal) => getTeam({ signal }));
  const [removal, setRemoval] = useState<PendingRemoval | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);
  const closeRemoval = useCallback(() => setRemoval(null), []);

  if (store.role !== 'OWNER') return <Navigate to="/" replace />;

  const handleAdded = (result: AddMemberResult) => {
    setToast(addedMessage(result));
    refetch();
  };

  const handleRemoved = (message: string) => {
    setRemoval(null);
    setToast(message);
    refetch();
  };

  const onlyOwner = data && data.members.length <= 1 && data.invitations.length === 0;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pt-safe pb-safe md:px-6">
      <PageHeader title="Equipo">Quién puede registrar ventas y movimientos en {store.name}.</PageHeader>

      <AddMemberForm onAdded={handleAdded} />

      <p className="text-sm text-ink-muted">
        Tus empleados pueden vender, agregar stock, registrar devoluciones y mermas, y crear productos. Solo tú puedes
        registrar ajustes y cambiar el equipo.
      </p>

      {status === 'loading' && !data && <LoadingRows />}

      {status === 'error' && <ErrorPanel message={failedMessage('No se pudo cargar el equipo.', error)} onRetry={refetch} />}

      {status !== 'error' && data && (
        <div aria-busy={status === 'loading'} className={`flex flex-col gap-6 ${status === 'loading' ? 'opacity-60' : ''}`}>
          <section aria-labelledby="team-members" className="flex flex-col gap-2">
            <h2 id="team-members" className="text-lg font-semibold">Con acceso</h2>
            <ul className="flex flex-col gap-2">
              {data.members.map((member) => (
                <MemberRow
                  key={member.userId}
                  member={member}
                  isYou={member.userId === user.id}
                  onRemove={(m) => setRemoval({ kind: 'member', member: m })}
                />
              ))}
            </ul>
          </section>

          {data.invitations.length > 0 && (
            <section aria-labelledby="team-invitations" className="flex flex-col gap-2">
              <h2 id="team-invitations" className="text-lg font-semibold">Pendientes</h2>
              <p className="text-sm text-ink-muted">Todavía no entran a la app con estos correos.</p>
              <ul className="flex flex-col gap-2">
                {data.invitations.map((invitation) => (
                  <InvitationRow
                    key={invitation.id}
                    invitation={invitation}
                    onRevoke={(i) => setRemoval({ kind: 'invitation', invitation: i })}
                  />
                ))}
              </ul>
            </section>
          )}

          {onlyOwner && <EmptyState icon={Users} message="Todavía no agregas a nadie. Escribe arriba el correo de tu empleado." />}
        </div>
      )}

      <ConfirmRemoval removal={removal} storeName={store.name} onClose={closeRemoval} onRemoved={handleRemoved} />

      <Toast message={toast} onDismiss={dismissToast} />
    </main>
  );
}

export default TeamPage;
