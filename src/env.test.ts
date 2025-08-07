import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock process.env globally
const mockEnv = vi.hoisted(() => ({
  NEXT_PUBLIC_SUPABASE_URL: "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
  NEXT_PUBLIC_BASE_URL: "",
  NEXT_PUBLIC_APP_NAME: "",
  NEXT_PUBLIC_APP_DESCRIPTION: "",
}));

vi.mock("process", () => ({
  env: mockEnv,
}));

describe("Environment Variables Validation", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetModules();
    // Clear all env vars
    Object.keys(mockEnv).forEach((key) => {
      mockEnv[key as keyof typeof mockEnv] = "";
    });
  });

  it("should fail validation when NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
    // Arrange: Set env without SUPABASE_URL
    mockEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    mockEnv.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
    mockEnv.NEXT_PUBLIC_APP_NAME = "Exodia";
    mockEnv.NEXT_PUBLIC_APP_DESCRIPTION = "Test";

    // Act & Assert: Should throw validation error
    await expect(async () => {
      await vi.importActual("./env");
    }).rejects.toThrow();
  });

  it("should fail validation when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing", async () => {
    // Arrange: Set env without ANON_KEY
    mockEnv.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    mockEnv.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
    mockEnv.NEXT_PUBLIC_APP_NAME = "Exodia";
    mockEnv.NEXT_PUBLIC_APP_DESCRIPTION = "Test";

    // Act & Assert: Should throw validation error
    await expect(async () => {
      await vi.importActual("./env");
    }).rejects.toThrow();
  });

  it("should fail validation when NEXT_PUBLIC_SUPABASE_URL has invalid format", async () => {
    // Arrange: Set env with invalid URL
    mockEnv.NEXT_PUBLIC_SUPABASE_URL = "not-a-valid-url";
    mockEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    mockEnv.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
    mockEnv.NEXT_PUBLIC_APP_NAME = "Exodia";
    mockEnv.NEXT_PUBLIC_APP_DESCRIPTION = "Test";

    // Act & Assert: Should throw validation error for invalid URL
    await expect(async () => {
      await vi.importActual("./env");
    }).rejects.toThrow();
  });

  it("should pass validation with all required Supabase variables", async () => {
    // Arrange: Set all required variables
    mockEnv.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    mockEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
    mockEnv.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
    mockEnv.NEXT_PUBLIC_APP_NAME = "Exodia";
    mockEnv.NEXT_PUBLIC_APP_DESCRIPTION = "Test";

    // Act: Import env module
    const { env } = (await vi.importActual("./env")) as { env: any };

    // Assert: Should have all required properties
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://test.supabase.co");
    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe(
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test"
    );
    expect(env.NEXT_PUBLIC_BASE_URL).toBe("http://localhost:3000");
    expect(env.NEXT_PUBLIC_APP_NAME).toBe("Exodia");
  });

  it("should validate that SUPABASE_URL contains supabase domain", async () => {
    // Arrange: Set non-supabase URL
    mockEnv.NEXT_PUBLIC_SUPABASE_URL = "https://example.com";
    mockEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    mockEnv.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
    mockEnv.NEXT_PUBLIC_APP_NAME = "Exodia";
    mockEnv.NEXT_PUBLIC_APP_DESCRIPTION = "Test";

    // Act & Assert: Should throw validation error
    await expect(async () => {
      await vi.importActual("./env");
    }).rejects.toThrow();
  });

  it("should validate that ANON_KEY has JWT-like format", async () => {
    // Arrange: Set invalid JWT format
    mockEnv.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    mockEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY = "invalid-key-format";
    mockEnv.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
    mockEnv.NEXT_PUBLIC_APP_NAME = "Exodia";
    mockEnv.NEXT_PUBLIC_APP_DESCRIPTION = "Test";

    // Act & Assert: Should throw validation error for invalid JWT format
    await expect(async () => {
      await vi.importActual("./env");
    }).rejects.toThrow();
  });
});
