import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  // Anonymous routes
  {
    path: '/login',
    component: () => import('@/components/pages/LoginPage.vue'),
    meta: { anonymous: true },
  },
  {
    path: '/register',
    component: () => import('@/components/pages/RegisterPage.vue'),
    meta: { anonymous: true },
  },
  {
    path: '/forgot',
    component: () => import('@/components/pages/ForgotPage.vue'),
    meta: { anonymous: true },
  },

  // Authenticated routes
  {
    path: '/dashboard',
    component: () => import('@/components/pages/DashboardPage.vue'),
    meta: { auth: true },
  },
  {
    path: '/account',
    component: () => import('@/components/pages/ProfilePage.vue'),
    meta: { auth: true },
  },
  {
    path: '/files',
    component: () => import('@/components/pages/FilesPage.vue'),
    meta: { auth: true },
  },
  {
    path: '/messenger',
    component: () => import('@/components/pages/MessengerPage.vue'),
    meta: { auth: true },
  },
  {
    path: '/group/:id',
    component: () => import('@/components/pages/GroupPage.vue'),
    meta: { auth: true },
  },
  {
    path: '/group/:id/archived',
    component: () => import('@/components/pages/GroupPage.vue'),
    meta: { auth: true, archived: true },
  },
  {
    path: '/project/:id',
    component: () => import('@/components/pages/ProjectPage.vue'),
    meta: { auth: true },
  },
  {
    path: '/project/:id/archived',
    component: () => import('@/components/pages/ProjectPage.vue'),
    meta: { auth: true, archived: true },
  },
  {
    path: '/work-package/:id',
    component: () => import('@/components/pages/WorkPackagePage.vue'),
    meta: { auth: true },
  },
  {
    path: '/work-package/:id/archived',
    component: () => import('@/components/pages/WorkPackagePage.vue'),
    meta: { auth: true, archived: true },
  },
  {
    path: '/tasks',
    component: () => import('@/components/pages/TasksPage.vue'),
    meta: { auth: true },
  },
  {
    path: '/workflows',
    component: () => import('@/components/pages/WorkflowsPage.vue'),
    meta: { auth: true },
  },
  {
    path: '/workflows/:id',
    component: () => import('@/components/pages/WorkflowDesignerPage.vue'),
    meta: { auth: true },
  },

  // Catch-all
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guards
router.beforeEach((to, _from, next) => {
  const raw = localStorage.getItem('ASOODE_AUTH');
  const isAuthenticated = !!raw;

  if (to.meta.auth && !isAuthenticated) {
    next({ path: '/login', query: { returnUrl: to.fullPath } });
  } else if (to.meta.anonymous && isAuthenticated) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
