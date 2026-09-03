import { describe, it, expect } from "vitest";
import { extractEntitiesFromText } from "../src/pipeline";

describe("extractEntitiesFromText", () => {
  describe("routing number extraction", () => {
    it("extracts valid ABA routing numbers", () => {
      const text = "Wire to routing number 021000021 at Chase Bank";
      const result = extractEntitiesFromText(text);
      expect(result.routingNumbers).toContain("021000021");
    });

    it("validates ABA checksum — rejects invalid 9-digit numbers", () => {
      const text = "Reference number 123456789 is not a routing number";
      const result = extractEntitiesFromText(text);
      expect(result.routingNumbers).not.toContain("123456789");
    });

    it("extracts multiple routing numbers from same document", () => {
      const text = "Primary: 021000021, Secondary: 026009593";
      const result = extractEntitiesFromText(text);
      expect(result.routingNumbers.length).toBe(2);
    });
  });

  describe("amount extraction", () => {
    it("extracts dollar amounts", () => {
      const text = "Wire amount: $450,000.00";
      const result = extractEntitiesFromText(text);
      expect(result.amounts).toContain("$450,000.00");
    });

    it("extracts multiple amounts", () => {
      const text = "Purchase price $500,000 earnest money $10,000";
      const result = extractEntitiesFromText(text);
      expect(result.amounts.length).toBe(2);
    });
  });

  describe("beneficiary extraction", () => {
    it("extracts beneficiary names", () => {
      const text = "Beneficiary: First American Title";
      const result = extractEntitiesFromText(text);
      expect(result.beneficiaries).toContain("First American Title");
    });

    it("extracts payee names", () => {
      const text = "Payee: Acme Escrow Services";
      const result = extractEntitiesFromText(text);
      expect(result.beneficiaries).toContain("Acme Escrow Services");
    });
  });

  describe("bank extraction", () => {
    it("extracts bank names", () => {
      const text = "Bank: JPMorgan Chase";
      const result = extractEntitiesFromText(text);
      expect(result.banks).toContain("JPMorgan Chase");
    });
  });

  describe("address extraction", () => {
    it("extracts US addresses with state and zip", () => {
      const text = "Property: 123 Main Street, Los Angeles, CA 90001";
      const result = extractEntitiesFromText(text);
      expect(result.addresses.length).toBe(1);
    });
  });

  describe("safe document rejection", () => {
    it("returns no entities for a banana bread recipe", () => {
      const text = `
        Banana Bread Recipe
        Ingredients: 3 ripe bananas, 1/3 cup melted butter, 3/4 cup sugar,
        1 egg beaten, 1 tsp vanilla extract, 1 tsp baking soda, pinch of salt,
        1 1/2 cups all-purpose flour. Preheat oven to 350 degrees.
        Mix bananas and butter, then add sugar egg and vanilla.
        Add baking soda salt and flour. Pour into greased loaf pan.
        Bake 60 to 65 minutes at 350 degrees.
      `;
      const result = extractEntitiesFromText(text);
      expect(result.routingNumbers.length).toBe(0);
      expect(result.beneficiaries.length).toBe(0);
      expect(result.banks.length).toBe(0);
    });
  });
});
