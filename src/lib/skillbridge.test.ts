import { describe, expect, it } from "vitest";
import {
  computeLevel,
  fillWeeks,
  orderSkills,
  readinessPercent,
  rebalancePlan,
  skillGap,
  skillStatus,
  weeklyStreak,
  parseISODate,
} from "./skillbridge";

describe("assessment level", () => {
  it("is 0.7 x quiz score + 0.3 x familiarity/5", () => {
    expect(computeLevel(2, 2, 5)).toBe(1);
    expect(computeLevel(1, 2, 0)).toBe(0.35);
    expect(computeLevel(1, 2, 3)).toBe(0.53);
    expect(computeLevel(0, 2, 0)).toBe(0);
  });
});

describe("readiness", () => {
  it("is the demand-weighted average level as a percentage", () => {
    expect(
      readinessPercent([
        { weight: 10, level: 1 },
        { weight: 10, level: 0 },
      ]),
    ).toBe(50);
    expect(
      readinessPercent([
        { weight: 9, level: 0.5 },
        { weight: 1, level: 1 },
      ]),
    ).toBe(55);
  });
});

describe("gap", () => {
  it("is weight x (1 - level)", () => {
    expect(skillGap(10, 0.3)).toBe(7);
    expect(skillGap(4, 1)).toBe(0);
  });
});

describe("status labels", () => {
  it("uses 0.8 and 0.4 thresholds", () => {
    expect(skillStatus(0.8)).toBe("completed");
    expect(skillStatus(0.79)).toBe("in_progress");
    expect(skillStatus(0.4)).toBe("in_progress");
    expect(skillStatus(0.39)).toBe("needs_practice");
  });
});

describe("skill order", () => {
  it("keeps HTML before CSS before JavaScript before React even when React has the biggest gap", () => {
    const order = orderSkills([
      { slug: "react", weight: 8, level: 0, prerequisites: ["javascript"] },
      { slug: "javascript", weight: 10, level: 0.9, prerequisites: ["css"] },
      { slug: "css", weight: 9, level: 0.9, prerequisites: ["html"] },
      { slug: "html", weight: 10, level: 0.9, prerequisites: [] },
      { slug: "git", weight: 6, level: 0, prerequisites: ["css"] },
    ]).map((s) => s.slug);
    expect(order.indexOf("html")).toBeLessThan(order.indexOf("css"));
    expect(order.indexOf("css")).toBeLessThan(order.indexOf("javascript"));
    expect(order.indexOf("javascript")).toBeLessThan(order.indexOf("react"));
    expect(order.indexOf("css")).toBeLessThan(order.indexOf("git"));
    // Git (gap 6) is ready right after CSS and beats JavaScript (gap 1)
    expect(order.indexOf("git")).toBeLessThan(order.indexOf("javascript"));
  });
});

describe("weekly planner", () => {
  it("fills each week up to the hour limit", () => {
    const weeks = fillWeeks(
      [
        { id: 1, estHours: 3 },
        { id: 2, estHours: 3 },
        { id: 3, estHours: 3 },
        { id: 4, estHours: 5 },
      ],
      6,
    );
    expect([...weeks.entries()]).toEqual([
      [1, 1],
      [2, 1],
      [3, 2],
      [4, 3],
    ]);
  });

  it("re-balance moves unfinished tasks from past weeks into the current week onward", () => {
    const start = parseISODate("2026-11-02"); // Monday
    const today = parseISODate("2026-11-18"); // week 3
    const result = rebalancePlan(
      [
        { id: 1, estHours: 2, week: 1, done: true, completedAt: parseISODate("2026-11-03") },
        { id: 2, estHours: 3, week: 1, done: false, completedAt: null },
        { id: 3, estHours: 3, week: 2, done: false, completedAt: null },
        { id: 4, estHours: 3, week: 3, done: false, completedAt: null },
      ],
      6,
      start,
      today,
    );
    expect(result.movedOverdue).toBe(2);
    expect(result.weeks.get(2)).toBe(3);
    expect(result.weeks.get(3)).toBe(3);
    expect(result.weeks.get(4)).toBe(4);
    expect(result.weeks.has(1)).toBe(false);
    expect(result.lastWeek).toBe(4);
  });
});

describe("weekly streak", () => {
  it("counts consecutive weeks with finished tasks", () => {
    const today = parseISODate("2026-11-18");
    expect(
      weeklyStreak(
        [parseISODate("2026-11-17"), parseISODate("2026-11-10"), parseISODate("2026-10-27")],
        today,
      ),
    ).toBe(2);
    expect(weeklyStreak([], today)).toBe(0);
  });
});
