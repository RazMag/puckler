import { describe, expect, it } from "vitest";
import { compactHighlights, fullGameOf, highlightsFor, watchHighlights } from "@/lib/nhl/highlights";
import type { Game } from "@/lib/nhl/types";
import itemsJson from "./__fixtures__/items.json";
import { downloadFor, itemsResponseSchema, normalizeDownloads, withDownloads } from "./downloads";

const downloads = normalizeDownloads(itemsResponseSchema.parse(itemsJson), {
  publicUrl: "https://jf.example.org/",
  series: "NHL",
});

function game(overrides: Partial<Game>): Game {
  return {
    id: 2026020237,
    gameType: 2,
    gameDate: "2026-11-03",
    startTimeUTC: "2026-11-04T00:00:00Z",
    phase: "final",
    venue: "Centre Bell",
    away: { abbrev: "WPG", score: 2 },
    home: { abbrev: "MTL", score: 4 },
    periodType: "REG",
    period: null,
    links: {
      fullGame: null,
      recap: "https://www.nhl.com/video/recap",
      condensed: null,
      gameCenter: "https://www.nhl.com/gamecenter/wpg-vs-mtl/2026/11/03/2026020237",
    },
    hidden: false,
    ...overrides,
  };
}

describe("downloads", () => {
  it("reads home and away teams from Sportarr's episode names", () => {
    expect(downloads).toEqual([
      {
        home: "MTL",
        away: "WPG",
        date: "2026-11-04",
        url: "https://jf.example.org/web/#/details?id=a1b2c3d4e5f60718293a4b5c6d7e8f90&serverId=5e1f0c2a9b7d4e3f8a6c1b2d3e4f5a6b",
      },
      expect.objectContaining({ home: "STL", away: "UTA", date: "2026-11-05" }),
    ]);
  });

  it("skips other series, unknown teams and odd items", () => {
    expect(downloads.map((d) => d.home)).toEqual(["MTL", "STL"]);
  });

  it("matches on the UTC day even though the NHL files the game a day earlier", () => {
    expect(downloadFor(game({}), downloads)?.home).toBe("MTL");
  });

  it("allows a day either way, but no more", () => {
    expect(downloadFor(game({ startTimeUTC: "2026-11-03T23:00:00Z" }), downloads)).toBeDefined();
    expect(downloadFor(game({ startTimeUTC: "2026-11-06T00:00:00Z" }), downloads)).toBeUndefined();
  });

  it("tells home from away", () => {
    const swapped = game({ away: { abbrev: "MTL", score: 4 }, home: { abbrev: "WPG", score: 2 } });
    expect(downloadFor(swapped, downloads)).toBeUndefined();
  });

  it("puts the full game first among the links", () => {
    const [linked] = withDownloads([game({})], downloads);
    expect(linked!.links.fullGame).toBe(downloads[0]!.url);
    expect(highlightsFor(linked!).map((h) => h.kind)).toEqual(["fullGame", "recap", "gameCenter"]);
  });

  it("offers the full game beside the recap, not instead of it", () => {
    const [linked] = withDownloads([game({})], downloads);
    expect(watchHighlights(linked!).map((h) => h.kind)).toEqual(["fullGame", "recap"]);
    expect(compactHighlights(linked!).map((h) => h.kind)).toEqual(["fullGame", "recap", "gameCenter"]);
    expect(watchHighlights(game({})).map((h) => h.kind)).toEqual(["recap"]);
  });

  it("keeps the full game linked behind the spoiler shield", () => {
    const [linked] = withDownloads([game({ hidden: true })], downloads);
    expect(fullGameOf(linked!)).toMatchObject({ kind: "fullGame", site: "Jellyfin" });
    expect(fullGameOf(game({}))).toBeUndefined();
  });
});
