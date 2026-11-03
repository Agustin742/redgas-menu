import { buildUploadFormData, cloudinaryUploadUrl, validateImageFile } from "./upload";

describe("validateImageFile", () => {
  it("accepts supported images within the size limit", () => {
    expect(validateImageFile({ type: "image/webp", size: 1000 })).toBeNull();
  });

  it("rejects other types and oversized files in Spanish", () => {
    expect(validateImageFile({ type: "image/gif", size: 10 })).toMatch(/JPG, PNG o WebP/);
    expect(validateImageFile({ type: "image/png", size: 6 * 1024 * 1024 })).toMatch(/5 MB/);
  });
});

describe("buildUploadFormData", () => {
  it("sends the signed parameters exactly as received", () => {
    const form = buildUploadFormData(new Blob(["x"]), {
      cloudName: "demo",
      apiKey: "key",
      timestamp: 1700000000,
      signature: "sig",
      folder: "coffee-menu/b1/product",
      allowedFormats: "jpg,png",
    });
    expect(form.get("api_key")).toBe("key");
    expect(form.get("timestamp")).toBe("1700000000");
    expect(form.get("signature")).toBe("sig");
    expect(form.get("folder")).toBe("coffee-menu/b1/product");
    expect(form.get("allowed_formats")).toBe("jpg,png");
    expect(form.get("file")).toBeInstanceOf(Blob);
    expect(cloudinaryUploadUrl("demo")).toBe("https://api.cloudinary.com/v1_1/demo/image/upload");
  });
});
