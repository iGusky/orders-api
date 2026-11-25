// Equipo de la tienda activa (fase 3, RF1-RF4). Ver "Equipo de la tienda activa" en docs/api.md.

import type { StoreRole } from './store';

// Una persona con acceso a la tienda (StoreMember en la API).
export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: StoreRole;
  createdAt: string; // fecha ISO 8601: desde cuándo tiene acceso
}

// Un correo agregado que todavía no corresponde a ninguna cuenta (D29).
export interface StoreInvitation {
  id: string;
  email: string;
  createdAt: string;
}

// Respuesta de GET /members: miembros (dueño primero) e invitaciones pendientes (más recientes primero).
export interface Team {
  members: TeamMember[];
  invitations: StoreInvitation[];
}

// Respuesta de POST /members: ADDED si el correo ya tenía cuenta, INVITED si queda pendiente.
export type AddMemberResult =
  | { status: 'ADDED'; member: TeamMember }
  | { status: 'INVITED'; invitation: StoreInvitation };
