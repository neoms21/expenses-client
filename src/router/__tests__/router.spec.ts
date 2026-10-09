/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import router from "../index";
import { useAuthStore } from "@/stores/auth";

vi.mock("@/lib/dbClient", () => {
  return {
    pb: {
      authStore: {
        record: null,
        token: "",
        isValid: false,
        clear: vi.fn(),
        onChange: vi.fn(),
      },
      collection: vi.fn(() => ({
        authWithPassword: vi.fn(),
        authWithOAuth2: vi.fn(),
        authRefresh: vi.fn(),
        create: vi.fn(),
      })),
    },
  };
});

describe("Router Authentication Guard", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    const { pb } = await import("@/lib/dbClient");
    (pb.authStore as any).isValid = false;
    (pb.authStore as any).token = "";
    const authStore = useAuthStore();
    authStore.logout();
    await router.push("/login");
  });

  it("redirects unauthenticated users from protected routes to /login with redirect query", async () => {
    const authStore = useAuthStore();
    expect(authStore.isAuthenticated).toBe(false);

    await router.push("/reports");
    expect(router.currentRoute.value.path).toBe("/login");
    expect(router.currentRoute.value.query.redirect).toBe("/reports");
  });

  it("allows unauthenticated users to access /login", async () => {
    await router.push("/login");
    expect(router.currentRoute.value.path).toBe("/login");
  });

  it("redirects authenticated allowed users away from /login to /", async () => {
    const { pb } = await import("@/lib/dbClient");
    (pb.authStore as any).isValid = true;
    const authStore = useAuthStore();
    authStore.token = "mock-token";
    authStore.user = { id: "usr-1", email: "neoms21@gmail.com" } as any;

    await router.push("/details");
    await router.push("/login");
    expect(router.currentRoute.value.path).toBe("/");
  });

  it("allows authenticated allowed users to navigate to protected routes", async () => {
    const { pb } = await import("@/lib/dbClient");
    (pb.authStore as any).isValid = true;
    const authStore = useAuthStore();
    authStore.token = "mock-token";
    authStore.user = { id: "usr-1", email: "neoms21@gmail.com" } as any;

    await router.push("/reports");
    expect(router.currentRoute.value.path).toBe("/reports");
  });

  it("blocks authenticated users with unauthorized email and redirects to login", async () => {
    const { pb } = await import("@/lib/dbClient");
    (pb.authStore as any).isValid = true;
    const authStore = useAuthStore();
    authStore.token = "mock-token";
    authStore.user = { id: "usr-intruder", email: "intruder@example.com" } as any;

    await router.push("/reports");
    expect(router.currentRoute.value.path).toBe("/login");
    expect(router.currentRoute.value.query.error).toBe("unauthorized");
  });
});
