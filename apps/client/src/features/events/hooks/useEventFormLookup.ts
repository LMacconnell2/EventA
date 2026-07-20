import { useQuery } from "@tanstack/react-query";

import {
  getOrganizerOptions,
  getVenueOptions,
} from "../api/eventLookupsApi";

import { getEventVisibility } from "../api/eventsApi";

import { getEventCategories } from "../api/eventsApi";

export function useEventFormLookups() {
  const venuesQuery = useQuery({
    queryKey: ["lookups", "venues"],
    queryFn: ({ signal }) =>
      getVenueOptions(signal),
    staleTime: 5 * 60 * 1000,
  });

  const organizersQuery = useQuery({
    queryKey: ["lookups", "organizers"],
    queryFn: ({ signal }) =>
      getOrganizerOptions(signal),
    staleTime: 5 * 60 * 1000,
  });

  const categoriesQuery = useQuery({
    queryKey: ["lookups", "event-categories"],
    queryFn: ({ signal }) =>
      getEventCategories(signal),
    staleTime: 5 * 60 * 1000,
  });

  const visibilityQuery = useQuery({
    queryKey: ["lookups", "event-visibilities"],
    queryFn: ({ signal }) =>
      getEventVisibility(signal),
    staleTime: 5 * 60 * 1000,
  });

  return {
    venueOptions:
      venuesQuery.data?.data ?? [],

    organizerOptions:
      organizersQuery.data?.data ?? [],

    categoryOptions:
      categoriesQuery.data?.data ?? [],

    visibilityOptions:
      visibilityQuery.data?.data ?? [],

    isPending:
      venuesQuery.isPending ||
      organizersQuery.isPending ||
      categoriesQuery.isPending ||
      visibilityQuery.isPending,

    isFetching:
      venuesQuery.isFetching ||
      organizersQuery.isFetching ||
      categoriesQuery.isFetching ||
      visibilityQuery.isFetching,

    error:
      venuesQuery.error ??
      organizersQuery.error ??
      categoriesQuery.error ??
      visibilityQuery.error ??
      null,

    refetch: () =>
      Promise.all([
        venuesQuery.refetch(),
        organizersQuery.refetch(),
        categoriesQuery.refetch(),
        visibilityQuery.refetch(),
      ]),
  };
}