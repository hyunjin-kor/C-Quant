import { describe, it, expect } from "vitest";
import {
  papersByDriverId,
  papersForMarket,
  papersWithQuantitativeAnchors,
  researchCatalogue
} from "../src/data/researchCatalogue";
import { catalystScenarios } from "../src/data/catalystScenarios";
import { catalystEventLog } from "../src/data/catalystEventLog";

describe("researchCatalogue", () => {
  it("ships at least 40 verified papers", () => {
    expect(researchCatalogue.length).toBeGreaterThanOrEqual(40);
  });

  it("every paper has a citation, finding, valid URL, and at least one variable", () => {
    for (const paper of researchCatalogue) {
      expect(paper.citation.length).toBeGreaterThan(20);
      expect(paper.finding.length).toBeGreaterThan(20);
      expect(/^https?:\/\//.test(paper.url)).toBe(true);
      expect(paper.variables.length).toBeGreaterThan(0);
    }
  });

  it("every paper targets at least one known market", () => {
    const valid = new Set(["eu-ets", "k-ets", "cn-ets", "shared"]);
    for (const paper of researchCatalogue) {
      expect(paper.markets.length).toBeGreaterThan(0);
      for (const market of paper.markets) {
        expect(valid.has(market)).toBe(true);
      }
    }
  });

  it("every paper carries at least one data source URL", () => {
    for (const paper of researchCatalogue) {
      expect(paper.dataSources.length).toBeGreaterThan(0);
      for (const ds of paper.dataSources) {
        expect(/^https?:\/\//.test(ds.url)).toBe(true);
      }
    }
  });

  it("evidenceStrength is one of three valid values", () => {
    const valid = new Set(["strong", "moderate", "exploratory"]);
    for (const paper of researchCatalogue) {
      expect(valid.has(paper.evidenceStrength)).toBe(true);
    }
  });

  it("retracted papers are excluded — Song 2024 PLoS ONE retraction must not appear", () => {
    for (const paper of researchCatalogue) {
      // The retracted paper was a random-forest factor analysis at PLoS ONE;
      // its citation should never appear in the catalogue.
      expect(paper.id).not.toContain("song-2024-rf");
      expect(paper.citation.toLowerCase()).not.toContain("random forest factor analysis");
    }
  });

  it("papersForMarket filters correctly per market", () => {
    const eu = papersForMarket("eu-ets");
    const kr = papersForMarket("k-ets");
    const cn = papersForMarket("cn-ets");
    expect(eu.length).toBeGreaterThan(0);
    expect(kr.length).toBeGreaterThan(0);
    expect(cn.length).toBeGreaterThan(0);
  });

  it("papersWithQuantitativeAnchors returns only papers that have at least one variable with quantitativeAnchor", () => {
    const subset = papersWithQuantitativeAnchors();
    expect(subset.length).toBeGreaterThan(0);
    for (const paper of subset) {
      expect(paper.variables.some((v) => Boolean(v.quantitativeAnchor))).toBe(true);
    }
  });

  it("driver IDs referenced by papers are non-empty strings when present", () => {
    for (const paper of researchCatalogue) {
      for (const v of paper.variables) {
        if (v.driverId !== undefined) {
          expect(typeof v.driverId).toBe("string");
          expect(v.driverId.length).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe("Catalogue / scenarios / events coverage", () => {
  it("at least 10 scenarios exist (literature expansion landed)", () => {
    expect(catalystScenarios.length).toBeGreaterThanOrEqual(10);
  });

  it("at least 20 events exist in the event log (literature expansion landed)", () => {
    expect(catalystEventLog.length).toBeGreaterThanOrEqual(20);
  });

  it("papersByDriverId returns ResearchPaper[] with the driver id when called for a known mapping", () => {
    // eu_oil should map to at least one paper
    const oilPapers = papersByDriverId("eu_oil");
    expect(oilPapers.length).toBeGreaterThan(0);
    for (const paper of oilPapers) {
      expect(paper.variables.some((v) => v.driverId === "eu_oil")).toBe(true);
    }
  });
});
