import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import TestView from "@/views/TestView.vue";
import Dashboard from "@/views/Dashboard.vue";
import ExpenseDetails from "@/views/ExpenseDetails.vue";
import { useAuthStore } from "@/stores/auth";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/LoginView.vue"),
      meta: { public: true },
    },
    {
      path: "/",
      name: "home",
      component: Dashboard,
    },
    {
      path: "/test",
      name: "test",
      component: TestView,
    },
    {
      path: "/reports",
      name: "reports",
      component: HomeView,
    },
    {
      path: "/details",
      name: "details",
      component: ExpenseDetails,
    },
    {
      path: "/about",
      name: "about",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("../views/AboutView.vue"),
    },
    {
      path: "/search",
      name: "search",
      component: () => import("../views/SearchView.vue"),
    },
    {
      path: "/tracker",
      name: "tracker",
      component: () => import("../views/MobileExpenseTrackerView.vue"),
      meta: { hideHeader: true },
    },
  ],
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  const isAuth = authStore.isAuthenticated;
  const isAllowed = !isAuth || authStore.isEmailAllowed();

  if (to.meta.public) {
    if (isAuth && isAllowed && to.name === "login") {
      next({ name: "home" });
      return;
    }
    next();
    return;
  }

  if (!isAuth) {
    next({ name: "login", query: { redirect: to.fullPath } });
    return;
  }

  if (!isAllowed) {
    authStore.logout();
    next({ name: "login", query: { error: "unauthorized" } });
    return;
  }

  next();
});

export default router;
