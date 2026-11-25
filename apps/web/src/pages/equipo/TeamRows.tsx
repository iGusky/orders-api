import { Mail, UserMinus, X } from 'lucide-react';
import type { StoreInvitation, TeamMember } from '../../types/member';
import { formatDay } from '../../utils/dates';
import { STORE_ROLE_LABEL } from '../../utils/stores';

const removeButton =
  'grid size-touch shrink-0 place-items-center rounded-full text-danger active:bg-danger-soft';

function Avatar({ member }: { member: TeamMember }) {
  if (member.avatarUrl) {
    // Las fotos de Google no cargan si se envía el Referer.
    return <img src={member.avatarUrl} alt="" referrerPolicy="no-referrer" className="size-10 shrink-0 rounded-full" />;
  }
  return (
    <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft font-semibold text-primary">
      {member.name.charAt(0).toUpperCase()}
    </span>
  );
}

interface MemberRowProps {
  member: TeamMember;
  isYou: boolean;
  onRemove: (member: TeamMember) => void;
}

// RF3: una persona con acceso. El dueño no se puede quitar (I17), así que no lleva botón.
export function MemberRow({ member, isYou, onRemove }: MemberRowProps) {
  return (
    <li className="flex min-h-16 items-center gap-3 rounded-md border border-line bg-surface px-4 py-2">
      <Avatar member={member} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-lg">
          {member.name}
          {isYou && <span className="text-ink-muted"> (tú)</span>}
        </span>
        <span className="truncate text-sm text-ink-muted">{member.email}</span>
        <span className="text-sm text-ink-muted">{STORE_ROLE_LABEL[member.role]}</span>
      </span>
      {member.role === 'EMPLOYEE' && (
        <button type="button" className={removeButton} aria-label={`Quitar a ${member.name}`} onClick={() => onRemove(member)}>
          <UserMinus className="size-5" aria-hidden />
        </button>
      )}
    </li>
  );
}

interface InvitationRowProps {
  invitation: StoreInvitation;
  onRevoke: (invitation: StoreInvitation) => void;
}

// RF3: un correo agregado que todavía no entra a la app.
export function InvitationRow({ invitation, onRevoke }: InvitationRowProps) {
  return (
    <li className="flex min-h-16 items-center gap-3 rounded-md border border-line bg-surface px-4 py-2">
      <Mail className="size-6 shrink-0 text-ink-muted" aria-hidden />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-lg">{invitation.email}</span>
        <span className="text-sm text-ink-muted">Agregado: {formatDay(invitation.createdAt)}</span>
      </span>
      <button
        type="button"
        className={removeButton}
        aria-label={`Cancelar el acceso de ${invitation.email}`}
        onClick={() => onRevoke(invitation)}
      >
        <X className="size-5" aria-hidden />
      </button>
    </li>
  );
}
