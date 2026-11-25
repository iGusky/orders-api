import { Injectable } from '@nestjs/common';
import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Prisma } from '../../../generated/prisma/client.js';
import { StoreRole } from '../../../generated/prisma/enums.js';
import { normalizeEmail } from '../../common/utils/index.js';
import { UsersService } from '../users/users.service.js';
import { CannotRemoveOwnerError } from './exceptions/CannotRemoveOwnerError.js';
import { InvitationAlreadyExistsError } from './exceptions/InvitationAlreadyExistsError.js';
import { InvitationNotFoundError } from './exceptions/InvitationNotFoundError.js';
import { MemberAlreadyExistsError } from './exceptions/MemberAlreadyExistsError.js';
import { MemberNotFoundError } from './exceptions/MemberNotFoundError.js';

// Lo que ve el dueño de cada miembro y de cada invitación pendiente (RF3).
const MEMBER_SELECT = {
  role: true,
  createdAt: true,
  user: { select: { id: true, name: true, email: true, avatarUrl: true } },
} as const;

const INVITATION_SELECT = { id: true, email: true, createdAt: true } as const;

type MemberRow = Prisma.StoreMemberGetPayload<{ select: typeof MEMBER_SELECT }>;

function toMemberView({ user, role, createdAt }: MemberRow) {
  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role,
    createdAt,
  };
}

// Una invitación está pendiente mientras no se acepte ni se cancele.
const PENDING = { acceptedAt: null, revokedAt: null } as const;

@Injectable()
export class MembersService {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
    private readonly usersService: UsersService,
  ) {}

  // RF3: miembros (dueño primero) e invitaciones pendientes (más recientes primero).
  async getTeam(storeId: string) {
    const [members, invitations] = await Promise.all([
      this.txHost.tx.storeMember.findMany({
        where: { storeId },
        select: MEMBER_SELECT,
        orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      }),
      this.txHost.tx.storeInvitation.findMany({
        where: { storeId, ...PENDING },
        select: INVITATION_SELECT,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { members: members.map(toMemberView), invitations };
  }

  // RF1. Si el correo ya es de una persona registrada, se agrega como EMPLOYEE; si no, queda una invitación
  // pendiente (D29). `email` llega normalizado del DTO.
  @Transactional()
  async addByEmail(storeId: string, email: string, ownerId: string) {
    const user = await this.usersService.findMostRecentUserByEmail(email);

    if (user) {
      try {
        const member = await this.txHost.tx.storeMember.create({
          data: {
            storeId,
            userId: user.id,
            role: StoreRole.EMPLOYEE,
            addedById: ownerId,
          },
          select: MEMBER_SELECT,
        });
        return { status: 'ADDED' as const, member: toMemberView(member) };
      } catch (error) {
        // El índice único (storeId, userId) es la fuente de verdad de I16, también con dos peticiones simultáneas.
        if (isUniqueViolation(error)) throw new MemberAlreadyExistsError();
        throw error;
      }
    }

    // I19 lo aplica esta revisión, no un índice: dos peticiones simultáneas podrían crear dos invitaciones iguales.
    // Es inofensivo: al aceptarse se convierten en una sola membresía (createMany con skipDuplicates).
    const pending = await this.txHost.tx.storeInvitation.findFirst({
      where: { storeId, email, ...PENDING },
    });
    if (pending) throw new InvitationAlreadyExistsError();

    const invitation = await this.txHost.tx.storeInvitation.create({
      data: { storeId, email, invitedById: ownerId },
      select: INVITATION_SELECT,
    });
    return { status: 'INVITED' as const, invitation };
  }

  // RF4 y RF5. Borrado físico (P17): el historial queda en Movement.createdById. Surte efecto en la siguiente
  // petición de esa persona, porque el guard revisa la membresía cada vez (I20).
  async removeMember(storeId: string, userId: string) {
    const member = await this.txHost.tx.storeMember.findUnique({
      where: { storeId_userId: { storeId, userId } },
      select: { id: true, role: true },
    });
    if (!member) throw new MemberNotFoundError();
    if (member.role === StoreRole.OWNER) throw new CannotRemoveOwnerError(); // I17

    await this.txHost.tx.storeMember.delete({ where: { id: member.id } });
  }

  // RF4: cancela una invitación pendiente de esta tienda.
  async revokeInvitation(storeId: string, invitationId: string) {
    const { count } = await this.txHost.tx.storeInvitation.updateMany({
      where: { id: invitationId, storeId, ...PENDING },
      data: { revokedAt: new Date() },
    });
    if (count === 0) throw new InvitationNotFoundError();
  }

  // RF2: al iniciar sesión con un correo verificado, sus invitaciones pendientes se vuelven membresías.
  // Primero se "reclaman" con un UPDATE (que bloquea esas filas) y después se leen por la marca de tiempo: así una
  // cancelación o un segundo inicio de sesión simultáneos no pueden aceptar la misma invitación dos veces.
  @Transactional()
  async acceptPendingInvitations(userId: string, rawEmail: string) {
    const email = normalizeEmail(rawEmail);
    const acceptedAt = new Date();

    const { count } = await this.txHost.tx.storeInvitation.updateMany({
      where: { email, ...PENDING, store: { deletedAt: null } },
      data: { acceptedAt },
    });
    if (count === 0) return;

    const accepted = await this.txHost.tx.storeInvitation.findMany({
      where: { email, acceptedAt },
      select: { storeId: true, invitedById: true },
    });

    await this.txHost.tx.storeMember.createMany({
      data: accepted.map(({ storeId, invitedById }) => ({
        storeId,
        userId,
        role: StoreRole.EMPLOYEE,
        addedById: invitedById,
      })),
      skipDuplicates: true, // Ya era miembro de alguna (I16): no es un error.
    });
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}
