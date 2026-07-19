export type CategoryType = "events" | "tickets" | "venues";

export type CategoryRecord = {
  id: number;
  name: string;
  color: string;
  icon: string | null;
  active: boolean;
  assignedCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CategoryPagination = {
  limit: number;
  offset: number;
  returned: number;
  total: number;
};

export type CategoriesResponse = {
  data: CategoryRecord[];
  pagination: CategoryPagination;
};

export type GetCategoriesParams = {
  active?: boolean;
  limit?: number;
  offset?: number;
  q?: string;
};

export type SaveCategoryInput = {
  name: string;
  color: string;
  icon: string | null;
  active?: boolean;
};

export type CategoryMutationResponse = {
  message: string;
  category: CategoryRecord;
};