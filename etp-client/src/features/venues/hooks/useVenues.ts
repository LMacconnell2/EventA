import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createVenue,
  deleteVenue,
  getVenue,
  getVenues,
  replaceVenueCategories,
  updateVenue,
  updateVenueStatus,
} from "../api/venueApi";
import type {
  CreateVenueBody,
  UpdateVenueBody,
  VenueListQuery,
} from "../types/venueTypes";

export const venueKeys = {
  all: ["venues"] as const,

  lists: () => [...venueKeys.all, "list"] as const,

  list: (query: VenueListQuery) =>
    [...venueKeys.lists(), query] as const,

  details: () => [...venueKeys.all, "detail"] as const,

  detail: (venueId: number) =>
    [...venueKeys.details(), venueId] as const,
};

export function useVenues(query: VenueListQuery) {
  return useQuery({
    queryKey: venueKeys.list(query),
    queryFn: () => getVenues(query),
    placeholderData: keepPreviousData,
  });
}

export function useVenue(venueId: number | null) {
  return useQuery({
    queryKey: venueId
      ? venueKeys.detail(venueId)
      : [...venueKeys.details(), "new"],
    queryFn: () => {
      if (!venueId) {
        throw new Error("A venue ID is required.");
      }

      return getVenue(venueId);
    },
    enabled: venueId !== null,
  });
}

export function useCreateVenue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createVenue,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: venueKeys.lists(),
      });
    },
  });
}

export function useUpdateVenue(venueId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateVenueBody) =>
      updateVenue(venueId, body),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: venueKeys.detail(venueId),
        }),
        queryClient.invalidateQueries({
          queryKey: venueKeys.lists(),
        }),
      ]);
    },
  });
}

export function useDeleteVenue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteVenue,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: venueKeys.all,
      });
    },
  });
}

export function useUpdateVenueStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      venueId,
      statusId,
    }: {
      venueId: number;
      statusId: number;
    }) => updateVenueStatus(venueId, statusId),

    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: venueKeys.detail(variables.venueId),
        }),
        queryClient.invalidateQueries({
          queryKey: venueKeys.lists(),
        }),
      ]);
    },
  });
}

export function useReplaceVenueCategories(venueId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryIds: number[]) =>
      replaceVenueCategories(venueId, categoryIds),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: venueKeys.detail(venueId),
        }),
        queryClient.invalidateQueries({
          queryKey: venueKeys.lists(),
        }),
      ]);
    },
  });
}

export function createVenueMutationBody(
  body: CreateVenueBody,
): CreateVenueBody {
  return body;
}