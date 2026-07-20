// src/features/dashboard/DashboardPage.tsx

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import "./Dashboard.css";

import {
  getDashboardStatistics,
  getRecentDashboardEvents,
  getUpcomingDashboardEvents,
  type DashboardDateRange,
} from "./api/dashboardApi";

import { DashboardEventsTable } from "./components/DashboardEventsTable";
import { DateRangePicker } from "./components/DateRangePicker";
import { StatChartCard } from "./components/StatChartCard";

const EVENT_LIMIT = 5;

const numberFormatter = new Intl.NumberFormat("en-US");

export function DashboardPage() {
  const [statsDateRange, setStatsDateRange] =
    useState<DashboardDateRange>({
      start: "2026-04-01",
      end: "2026-05-24",
    });

  const hasValidDateRange =
    Boolean(statsDateRange.start) &&
    Boolean(statsDateRange.end) &&
    statsDateRange.start <= statsDateRange.end;

  const statisticsQuery = useQuery({
    queryKey: [
      "dashboard",
      "statistics",
      statsDateRange.start,
      statsDateRange.end,
    ],
    queryFn: ({ signal }) =>
      getDashboardStatistics(
        statsDateRange,
        signal,
      ),
    enabled: hasValidDateRange,
  });

  const upcomingEventsQuery = useQuery({
    queryKey: [
      "dashboard",
      "events",
      "upcoming",
      EVENT_LIMIT,
    ],
    queryFn: ({ signal }) =>
      getUpcomingDashboardEvents(
        EVENT_LIMIT,
        signal,
      ),
  });

  const recentEventsQuery = useQuery({
    queryKey: [
      "dashboard",
      "events",
      "recent",
      EVENT_LIMIT,
    ],
    queryFn: ({ signal }) =>
      getRecentDashboardEvents(
        EVENT_LIMIT,
        signal,
      ),
  });

  const statistics = statisticsQuery.data;

  const revenueFormatter = new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency:
        statistics?.revenue.currency ?? "USD",
      maximumFractionDigits: 2,
    },
  );

  return (
    <div className="dashboard-page">
      <header className="dashboard-page__header">
        <h1>Dashboard</h1>

        <p>
          Welcome back! Here's an overview of your
          events platform.
        </p>
      </header>

      <section
        className="dashboard-statistics-panel"
        aria-labelledby="general-statistics-heading"
        aria-busy={statisticsQuery.isFetching}
      >
        <div className="dashboard-statistics-panel__header">
          <h2 id="general-statistics-heading">
            General Statistics
          </h2>

          <DateRangePicker
            value={statsDateRange}
            onChange={setStatsDateRange}
            disabled={statisticsQuery.isFetching}
          />
        </div>

        {!hasValidDateRange && (
          <div
            className="dashboard-state-message dashboard-state-message--error"
            role="alert"
          >
            The start date must be earlier than or
            equal to the end date.
          </div>
        )}

        {statisticsQuery.isPending &&
          hasValidDateRange && (
            <div
              className="dashboard-state-message"
              role="status"
            >
              Loading dashboard statistics…
            </div>
          )}

        {statisticsQuery.isError && (
          <div
            className="dashboard-state-message dashboard-state-message--error"
            role="alert"
          >
            {statisticsQuery.error instanceof Error
              ? statisticsQuery.error.message
              : "Unable to load dashboard statistics."}
          </div>
        )}

        {statistics && (
          <div className="dashboard-stats-grid">
            <StatChartCard
              title="Total Revenue"
              data={statistics.revenue.series}
              color="#3b82f6"
              value={revenueFormatter.format(
                statistics.revenue.total,
              )}
              valueFormatter={(value) =>
                revenueFormatter.format(value)
              }
            />

            <StatChartCard
              title="Number of Attendees"
              data={statistics.attendees.series}
              color="#10b981"
              value={numberFormatter.format(
                statistics.attendees.total,
              )}
              valueFormatter={(value) =>
                numberFormatter.format(value)
              }
            />
          </div>
        )}
      </section>

      <DashboardEventsTable
        title="Upcoming Events"
        events={upcomingEventsQuery.data ?? []}
        isLoading={upcomingEventsQuery.isPending}
        error={
          upcomingEventsQuery.isError
            ? upcomingEventsQuery.error
            : null
        }
        emptyMessage="There are no upcoming events."
      />

      <DashboardEventsTable
        title="Recent Events"
        events={recentEventsQuery.data ?? []}
        isLoading={recentEventsQuery.isPending}
        error={
          recentEventsQuery.isError
            ? recentEventsQuery.error
            : null
        }
        emptyMessage="There are no recent events."
      />
    </div>
  );
}