import { createUploadTracker, discardUpload } from "./unsaved-upload";

describe("createUploadTracker", () => {
  test("discards the previous unsaved upload when a new one replaces it", () => {
    const discard = jest.fn();
    const tracker = createUploadTracker(discard);
    tracker.track("a");
    tracker.track("b");
    expect(discard).toHaveBeenCalledTimes(1);
    expect(discard).toHaveBeenCalledWith("a");
    expect(tracker.pending).toBe("b");
  });

  test("never discards an image after it was saved", () => {
    const discard = jest.fn();
    const tracker = createUploadTracker(discard);
    tracker.track("a");
    tracker.markSaved();
    tracker.discard();
    tracker.track("b");
    expect(discard).not.toHaveBeenCalled();
  });

  test("discard releases the pending image once", () => {
    const discard = jest.fn();
    const tracker = createUploadTracker(discard);
    tracker.track("a");
    tracker.discard();
    tracker.discard();
    expect(discard).toHaveBeenCalledTimes(1);
    expect(tracker.pending).toBeNull();
  });

  test("does nothing when no upload happened", () => {
    const discard = jest.fn();
    createUploadTracker(discard).discard();
    expect(discard).not.toHaveBeenCalled();
  });
});

describe("discardUpload", () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  test("sends a keepalive DELETE with the public id", () => {
    fetchMock.mockResolvedValue({ ok: true });
    discardUpload("coffee-menu/b/product/x");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/uploads",
      expect.objectContaining({
        method: "DELETE",
        keepalive: true,
        body: JSON.stringify({ publicId: "coffee-menu/b/product/x" }),
      }),
    );
  });

  test("swallows network failures", () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    expect(() => discardUpload("x")).not.toThrow();
  });
});
