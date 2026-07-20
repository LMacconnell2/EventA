import { useQuery } from "@tanstack/react-query";
import {
  getVenueCategories,
  getVenueStatuses,
} from "../api/venueLookupApi";

export const venueLookupKeys = {
  all: ["venue-lookups"] as const,

  statuses: (includeInactive: boolean) =>
    [
      ...venueLookupKeys.all,
      "statuses",
      { includeInactive },
    ] as const,

  categories: (includeInactive: boolean) =>
    [
      ...venueLookupKeys.all,
      "categories",
      { includeInactive },
    ] as const,
};

export function useVenueStatuses(
  includeInactive = false,
) {
  return useQuery({
    queryKey: venueLookupKeys.statuses(includeInactive),
    queryFn: () => getVenueStatuses(includeInactive),
    staleTime: 5 * 60 * 1000,
  });
}

export function useVenueCategories(
  includeInactive = false,
) {
  return useQuery({
    queryKey: venueLookupKeys.categories(includeInactive),
    queryFn: () => getVenueCategories(includeInactive),
    staleTime: 5 * 60 * 1000,
  });
}