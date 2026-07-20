import { useQuery } from "@tanstack/react-query";

import { getTagOptions } from "../api/tagsApi";
import { useDebouncedValue } from "./useDebouncedValue";

export function useTagLookup(
  searchTerm: string,
  includeInactive = false,
) {
  const debouncedSearchTerm = useDebouncedValue(
    searchTerm,
    300,
  );

  return useQuery({
    queryKey: [
      "lookups",
      "tags",
      debouncedSearchTerm,
      includeInactive,
    ],

    queryFn: ({ signal }) =>
      getTagOptions(
        {
          q: debouncedSearchTerm,
          active: includeInactive ? "all" : true,
          page: 1,
          perPage: 100,
        },
        signal,
      ),

    staleTime: 60 * 1000,
  });
}