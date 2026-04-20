import { describe, it, expect, beforeEach } from "vitest";
import { ApiError, setAccessToken, getAccessToken } from "@/lib/api/client";

describe("ApiError", () => {
  it("is an instance of Error", () => {
    const err = new ApiError(404, "Not found");
    expect(err).toBeInstanceOf(Error);
  });

  it("sets name to 'ApiError'", () => {
    const err = new ApiError(500, "Server error");
    expect(err.name).toBe("ApiError");
  });

  it("stores status code", () => {
    const err = new ApiError(401, "Unauthorized");
    expect(err.status).toBe(401);
  });

  it("stores message", () => {
    const err = new ApiError(400, "Bad request");
    expect(err.message).toBe("Bad request");
  });

  it("stores fieldErrors when provided", () => {
    const fieldErrors = { email: ["Invalid email"], password: ["Too short"] };
    const err = new ApiError(400, "Validation failed", fieldErrors);
    expect(err.fieldErrors).toEqual(fieldErrors);
  });

  it("fieldErrors is undefined when not provided", () => {
    const err = new ApiError(500, "Server error");
    expect(err.fieldErrors).toBeUndefined();
  });

  it("can be caught as a regular Error", () => {
    expect(() => {
      throw new ApiError(403, "Forbidden");
    }).toThrow("Forbidden");
  });
});

describe("setAccessToken / getAccessToken", () => {
  beforeEach(() => {
    setAccessToken(null);
  });

  it("returns null initially", () => {
    expect(getAccessToken()).toBeNull();
  });

  it("stores a token and retrieves it", () => {
    setAccessToken("my-jwt-token");
    expect(getAccessToken()).toBe("my-jwt-token");
  });

  it("overwrites a previous token", () => {
    setAccessToken("token-a");
    setAccessToken("token-b");
    expect(getAccessToken()).toBe("token-b");
  });

  it("can be cleared back to null", () => {
    setAccessToken("some-token");
    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
  });
});
