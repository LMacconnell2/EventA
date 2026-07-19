export type CategoryType = "events" | "tickets" | "venues";

export interface CategoryListQuery {
  active?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateCategoryBody {
  name: string;
  color?: string | null;
  icon?: string | null;
}

export interface UpdateCategoryBody {
  name?: string;
  color?: string | null;
  icon?: string | null;
  active?: boolean;
}

export interface CategoryRouteParams {
  id: number;
}

export interface CategoryRecord {
  id: number;
  name: string;
  color: string | null;
  icon: string | null;
  active: boolean;
  assignedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryListResult {
  data: CategoryRecord[];
  pagination: {
    limit: number;
    offset: number;
    returned: number;
    total: number;
  };
}