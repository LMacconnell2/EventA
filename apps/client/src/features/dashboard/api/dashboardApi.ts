// src/features/dashboard/api/dashboardApi.ts

const API_URL = import.meta.env.VITE_API_URL;

export type DashboardDateRange = {
  start: string;
  end: string;
};

export type DashboardSeriesPoint = {
  date: string;
  value: number;
};

export type DashboardStatistics = {
  dateRange: {
    start: string;
    end: string;
  };

  revenue: {
    total: number;
    currency: string;
    series: DashboardSeriesPoint[];
  };

  attendees: {
    total: number;
    series: DashboardSeriesPoint[];
  };
};

export type DashboardEvent = {
  id: number;
  name: string;
  startDate: string;
};

type DashboardEventsResponse = {
  data: DashboardEvent[];
};

type ApiErrorResponse = {
  message?: string;
  error?: string;
};

async function parseResponse<T>(
  response: Response,
): Promise<T> {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;

    try {
      const body =
        (await response.json()) as ApiErrorResponse;

      message =
        body.message ??
        body.error ??
        message;
    } catch {
      // Keep the fallback message when the response is not JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function getDashboardStatistics(
  dateRange: DashboardDateRange,
  signal?: AbortSignal,
): Promise<DashboardStatistics> {
  const searchParams = new URLSearchParams({
    date_start: dateRange.start,
    date_end: dateRange.end,
  });

  const response = await fetch(
    `${API_URL}/api/dashboard/statistics?${searchParams.toString()}`,
    {
      method: "GET",
      credentials: "include",
      signal,
    },
  );

  return parseResponse<DashboardStatistics>(response);
}

export async function getUpcomingDashboardEvents(
  limit = 5,
  signal?: AbortSignal,
): Promise<DashboardEvent[]> {
  const searchParams = new URLSearchParams({
    limit: String(limit),
  });

  const response = await fetch(
    `${API_URL}/api/dashboard/events/upcoming?${searchParams.toString()}`,
    {
      method: "GET",
      credentials: "include",
      signal,
    },
  );

  const body =
    await parseResponse<DashboardEventsResponse>(
      response,
    );

  return body.data;
}

export async function getRecentDashboardEvents(
  limit = 5,
  signal?: AbortSignal,
): Promise<DashboardEvent[]> {
  const searchParams = new URLSearchParams({
    limit: String(limit),
  });

  const response = await fetch(
    `${API_URL}/api/dashboard/events/recent?${searchParams.toString()}`,
    {
      method: "GET",
      credentials: "include",
      signal,
    },
  );

  const body =
    await parseResponse<DashboardEventsResponse>(
      response,
    );

  return body.data;
}