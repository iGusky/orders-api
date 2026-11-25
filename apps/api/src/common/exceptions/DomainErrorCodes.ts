export enum DomainErrorCode {
    InsufficientStock = "INSUFFICIENT_STOCK",
    ProductNotFound = "PRODUCT_NOT_FOUND",
    SessionNotFound = "SESSION_NOT_FOUND",
    UserInfoNotFoundOnGoogle = "USER_INFO_NOT_FOUND_ON_GOOGLE",
    UserAlreadyHasStore = "USER_HAS_STORE",
    // Tienda activa y permisos (D28, D30)
    StoreNotSelected = "STORE_NOT_SELECTED",
    StoreNotFound = "STORE_NOT_FOUND",
    RoleNotAllowed = "ROLE_NOT_ALLOWED",
    // Equipo de la tienda (RF1, RF4)
    MemberAlreadyExists = "MEMBER_ALREADY_EXISTS",
    InvitationAlreadyExists = "INVITATION_ALREADY_EXISTS",
    MemberNotFound = "MEMBER_NOT_FOUND",
    InvitationNotFound = "INVITATION_NOT_FOUND",
    CannotRemoveOwner = "CANNOT_REMOVE_OWNER",
}
