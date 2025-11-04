import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import TestView from '@/views/TestView.vue';
import Dashboard from '@/views/Dashboard.vue';
import ExpenseDetails from '@/views/ExpenseDetails.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Dashboard,
    },
    {
      path: '/test',
      name: 'test',
      component: TestView,
    },
    {
      path: '/reports',
      name: 'reports',
      component: HomeView,
    },
    {
      path: '/details',
      name: 'details',
      component: ExpenseDetails,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
  ],
});

export default router;
