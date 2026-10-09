/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAuthStore } from "../auth";
import { pb } from "@/lib/dbClient";

vi.mock("@/lib/dbClient", () => {
  const authStoreMock = {
    record: null as any,
    token: "",
    isValid: false,
    clear: vi.fn(function (this: any) {
      this.record = null;
      this.token = "";
      this.isValid = false;
      this._listener?.("", null);
    }),
    onChange: vi.fn(function (this: any, callback: (token: string, record: any) => void) {
      this._listener = callback;
    }),
    _listener: null as any,
  };

  const usersCollectionMock = {
    authWithPassword: vi.fn(),
    authWithOAuth2: vi.fn(),
    authRefresh: vi.fn(),
    create: vi.fn(),
    requestPasswordReset: vi.fn(),
  };

  const pbMock = {
    authStore: authStoreMock,
    collection: vi.fn((name: string) => {
      if (name === "users") return usersCollectionMock;
      return {};
    }),
  };

  return { pb: pbMock };
});

describe("useAuthStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    (pb.authStore as any).record = null;
    (pb.authStore as any).token = "";
    (pb.authStore as any).isValid = false;
  });

  it("initializes with unauthenticated state", () => {
    const auth = useAuthStore();
    expect(auth.isAuthenticated).toBe(false);
    expect(auth.user).toBeNull();
    expect(auth.token).toBe("");
  });

  it("authenticates with password successfully", async () => {
    const mockUser = { id: "usr-123", email: "neoms21@gmail.com", name: "Test User" };
    const mockToken = "mock-token-abc";

    vi.mocked(pb.collection("users").authWithPassword).mockResolvedValueOnce({
      token: mockToken,
      record: mockUser as any,
    });

    const auth = useAuthStore();
    const result = await auth.loginWithPassword("neoms21@gmail.com", "password123");

    expect(pb.collection).toHaveBeenCalledWith("users");
    expect(pb.collection("users").authWithPassword).toHaveBeenCalledWith(
      "neoms21@gmail.com",
      "password123",
    );
    expect(result.token).toBe(mockToken);
    expect(auth.user).toEqual(mockUser);
    expect(auth.token).toBe(mockToken);
  });

  it("authenticates with Google OAuth2 successfully", async () => {
    const mockUser = { id: "usr-456", email: "neoms21@gmail.com", name: "Google User" };
    const mockToken = "mock-oauth-token";

    vi.mocked(pb.collection("users").authWithOAuth2).mockResolvedValueOnce({
      token: mockToken,
      record: mockUser as any,
      meta: undefined,
    });

    const auth = useAuthStore();
    const result = await auth.loginWithOAuth2("google");

    expect(pb.collection("users").authWithOAuth2).toHaveBeenCalledWith({ provider: "google" });
    expect(result.token).toBe(mockToken);
    expect(auth.user).toEqual(mockUser);
    expect(auth.token).toBe(mockToken);
  });

  it("registers new user and logs in", async () => {
    const mockUser = { id: "usr-789", email: "pratibha.preet@gmail.com", name: "New User" };
    const mockToken = "new-user-token";

    vi.mocked(pb.collection("users").create).mockResolvedValueOnce(mockUser as any);
    vi.mocked(pb.collection("users").authWithPassword).mockResolvedValueOnce({
      token: mockToken,
      record: mockUser as any,
    });

    const auth = useAuthStore();
    await auth.register("pratibha.preet@gmail.com", "password123", "password123", "New User");

    expect(pb.collection("users").create).toHaveBeenCalledWith({
      email: "pratibha.preet@gmail.com",
      password: "password123",
      passwordConfirm: "password123",
      name: "New User",
    });
    expect(pb.collection("users").authWithPassword).toHaveBeenCalledWith(
      "pratibha.preet@gmail.com",
      "password123",
    );
    expect(auth.user).toEqual(mockUser);
  });

  it("logs out and clears auth state", () => {
    const auth = useAuthStore();
    auth.user = { id: "usr-1" } as any;
    auth.token = "active-token";

    auth.logout();

    expect(pb.authStore.clear).toHaveBeenCalled();
    expect(auth.user).toBeNull();
    expect(auth.token).toBe("");
  });

  it("refreshes auth session when valid", async () => {
    (pb.authStore as any).isValid = true;
    const refreshedUser = { id: "usr-refreshed", email: "neoms21@gmail.com" };
    const refreshedToken = "refreshed-token";

    vi.mocked(pb.collection("users").authRefresh).mockResolvedValueOnce({
      token: refreshedToken,
      record: refreshedUser as any,
    });

    const auth = useAuthStore();
    await auth.refreshAuth();

    expect(pb.collection("users").authRefresh).toHaveBeenCalled();
    expect(auth.user).toEqual(refreshedUser);
    expect(auth.token).toBe(refreshedToken);
  });

  it("requests password reset email", async () => {
    vi.mocked(pb.collection("users").requestPasswordReset).mockResolvedValueOnce(true as any);

    const auth = useAuthStore();
    const result = await auth.requestPasswordReset("forgot@example.com");

    expect(pb.collection("users").requestPasswordReset).toHaveBeenCalledWith("forgot@example.com");
    expect(result).toBe(true);
  });

  it("computes userDisplayName correctly", () => {
    const auth = useAuthStore();
    expect(auth.userDisplayName).toBe("User");

    auth.user = { id: "1", email: "emailonly@example.com" } as any;
    expect(auth.userDisplayName).toBe("emailonly@example.com");

    auth.user = { id: "1", email: "user@example.com", name: "Alice Bob" } as any;
    expect(auth.userDisplayName).toBe("Alice Bob");
  });

  describe("Email Whitelist Validation", () => {
    it("allows emails matching VITE_ALLOWED_EMAILS", () => {
      const auth = useAuthStore();
      expect(auth.isEmailAllowed("neoms21@gmail.com")).toBe(true);
      expect(auth.isEmailAllowed("NEOMS21@GMAIL.COM")).toBe(true);
      expect(auth.isEmailAllowed("pratibha.preet@gmail.com")).toBe(true);
      expect(auth.isEmailAllowed("unauthorized@gmail.com")).toBe(false);
      expect(auth.isEmailAllowed("")).toBe(false);
      expect(auth.isEmailAllowed(undefined)).toBe(false);
    });

    it("rejects Google OAuth login when email is not allowed", async () => {
      const mockUnauthorizedUser = { id: "usr-999", email: "intruder@gmail.com" };
      vi.mocked(pb.collection("users").authWithOAuth2).mockResolvedValueOnce({
        token: "some-token",
        record: mockUnauthorizedUser as any,
        meta: undefined,
      });

      const auth = useAuthStore();
      await expect(auth.loginWithOAuth2("google")).rejects.toThrow("Access denied");
      expect(pb.authStore.clear).toHaveBeenCalled();
      expect(auth.user).toBeNull();
    });

    it("rejects password login when email is not allowed", async () => {
      const auth = useAuthStore();
      await expect(auth.loginWithPassword("intruder@gmail.com", "pass123")).rejects.toThrow(
        "Access denied",
      );
      expect(pb.collection("users").authWithPassword).not.toHaveBeenCalled();
    });
  });
});
