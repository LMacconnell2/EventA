export type IdParams = {
  eventId: string;
  ticketId?: string;
};

export type CreateTicketBody = {
  status_id?: number;
  ticket_name: string;
  ticket_description?: string | null;
  ticket_price?: number;
  discount_percentage?: number | null;
  discount_fixed?: number | null;
  quantity_available?: number;
  sale_start?: string | null;
  sale_end?: string | null;
  min_per_order?: number;
  max_per_order?: number | null;
  category_ids?: number[];
  allowed_role_ids?: number[];
};

export type UpdateTicketBody = Partial<CreateTicketBody>;

export type UpdateTicketStatusBody = {
  status_id: number;
};

export type ReplaceTicketCategoriesBody = {
  category_ids: number[];
};

export type ReplaceTicketRolesBody = {
  role_ids: number[];
};

export type TicketListQuery = {
  q?: string;
  status_ids?: string;
  category_ids?: string;
  role_ids?: string;
  price_min?: string;
  price_max?: string;
  sale_start_from?: string;
  sale_start_to?: string;
  sale_end_from?: string;
  sale_end_to?: string;
  has_available_quantity?: string;
  page?: string;
  per_page?: string;
  sort?: string;
  order?: string;
};

export type TicketAttendeeListQuery = {
  q?: string;
  status_ids?: string;
  checked_in?: string;
  purchase_date_start?: string;
  purchase_date_end?: string;
  page?: string;
  per_page?: string;
  sort?: string;
  order?: string;
};

export type PublicTicketListQuery = {
  quantity?: string;
};

export type AppUser = {
  userId: number;
  roles: Array<number | { roleId?: number; role_id?: number }>;
};

export function getRoleIds(user?: AppUser | null): number[] {
  if (!user) return [];

  return user.roles
    .map((role) => {
      if (typeof role === "number") return role;
      return role.roleId ?? role.role_id;
    })
    .filter((roleId): roleId is number => Number.isInteger(roleId));
}

export type EventParams = {
  eventId: string;
};

export type TicketParams = {
  eventId: string;
  ticketId: string;
};