import { buildMenuUrl, qrFileName } from "./qr";

const headers = (values: Record<string, string>) => ({
  get: (name: string) => values[name] ?? null,
});

describe("buildMenuUrl", () => {
  it("prefers forwarded host and proto, first value only", () => {
    expect(
      buildMenuUrl(
        headers({
          "x-forwarded-host": "carta.redgas.com, proxy.internal",
          "x-forwarded-proto": "https, http",
          host: "internal:3000",
        }),
        "red-gas",
      ),
    ).toBe("https://carta.redgas.com/c/red-gas");
  });

  it("falls back to host and http on localhost", () => {
    expect(buildMenuUrl(headers({ host: "localhost:3005" }), "red-gas")).toBe(
      "http://localhost:3005/c/red-gas",
    );
    expect(buildMenuUrl(headers({ host: "127.0.0.1:3000" }), "x")).toBe(
      "http://127.0.0.1:3000/c/x",
    );
  });

  it("uses https for non-local hosts without forwarded proto", () => {
    expect(buildMenuUrl(headers({ host: "menu.example.com" }), "red-gas")).toBe(
      "https://menu.example.com/c/red-gas",
    );
  });
});

describe("qrFileName", () => {
  it("builds a safe file name", () => {
    expect(qrFileName("red-gas", "png")).toBe("red-gas-qr.png");
    expect(qrFileName("Red Gas!", "svg")).toBe("red-gas-qr.svg");
    expect(qrFileName("***", "png")).toBe("carta-qr.png");
  });
});
