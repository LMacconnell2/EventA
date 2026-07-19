// src/routes/dashboardRoutes/dashboardTypes.ts

export type DashboardStatisticsQuery = {
  date_start: string;
  date_end: string;
};

export type DashboardEventsQuery = {
  limit?: number;
};

export type DashboardSeriesPoint = {
  date: string;
  value: number;
};

export type DashboardStatisticsResponse = {
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

export type DashboardEventsResponse = {
  data: DashboardEvent[];
};