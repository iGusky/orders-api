import { http } from './http';
import type { AddMemberResult, Team } from '../../types/member';

// Todos son de la tienda activa (X-Store-Id) y solo para el dueño: un empleado recibe 403 ROLE_NOT_ALLOWED (D30).

export async function getTeam(options: { signal?: AbortSignal } = {}): Promise<Team> {
  const { data } = await http.get<Team>('/members', { signal: options.signal });
  return data;
}

// 409 MEMBER_ALREADY_EXISTS si ya es miembro (incluido el dueño); 409 INVITATION_ALREADY_EXISTS si ya está pendiente.
export async function addMember(email: string): Promise<AddMemberResult> {
  const { data } = await http.post<AddMemberResult>('/members', { email });
  return data;
}

// 404 MEMBER_NOT_FOUND si ya no es miembro; 409 CANNOT_REMOVE_OWNER con el dueño.
export async function removeMember(userId: string): Promise<void> {
  await http.delete(`/members/${userId}`);
}

// 404 INVITATION_NOT_FOUND si ya se aceptó o se canceló.
export async function revokeInvitation(invitationId: string): Promise<void> {
  await http.delete(`/invitations/${invitationId}`);
}
