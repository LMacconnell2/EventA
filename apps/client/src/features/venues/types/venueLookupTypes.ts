export type VenueStatusLookup = {
  venue_status_id: number;
  venue_status_name: string;
  color: string | null;
  active: boolean;
};

export type VenueCategoryLookup = {
  venue_category_id: number;
  venue_category_name: string;
  color: string | null;
  icon: string | null;
  active: boolean;
};

export type LookupResponse<T> =
  | T[]
  | {
      data: T[];
    };