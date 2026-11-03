import { fitFontSize, qrCardFileName, shortUrl } from "./qr-card-layout";

describe("fitFontSize", () => {
  const measure = (size: number) => size * 10;

  it("keeps the max size when it fits", () => {
    expect(fitFontSize(measure, 1000, 90, 30)).toBe(90);
  });

  it("shrinks until it fits", () => {
    expect(fitFontSize(measure, 500, 90, 30)).toBe(50);
  });

  it("never goes below the minimum", () => {
    expect(fitFontSize(measure, 100, 90, 30)).toBe(30);
  });
});

describe("shortUrl", () => {
  it("strips protocol and trailing slash", () => {
    expect(shortUrl("https://menu.example.com/c/red-gas")).toBe("menu.example.com/c/red-gas");
    expect(shortUrl("http://localhost:3005/c/x/")).toBe("localhost:3005/c/x");
  });
});

describe("qrCardFileName", () => {
  it("builds the card file name", () => {
    expect(qrCardFileName("red-gas")).toBe("red-gas-qr-tarjeta.png");
    expect(qrCardFileName("***")).toBe("carta-qr-tarjeta.png");
  });
});
