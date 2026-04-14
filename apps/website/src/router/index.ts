import { createRouter, createWebHistory } from 'vue-router'
import i18n from '@/i18n'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/:locale(fa|ar|tr)?',
      component: () => import('@/pages/HomePage.vue'),
      name: 'home',
    },
    {
      path: '/:locale(fa|ar|tr)?/features',
      component: () => import('@/pages/FeaturesPage.vue'),
      name: 'features',
    },
    {
      path: '/:locale(fa|ar|tr)?/pricing',
      component: () => import('@/pages/PricingPage.vue'),
      name: 'pricing',
    },
    {
      path: '/:locale(fa|ar|tr)?/about',
      component: () => import('@/pages/AboutPage.vue'),
      name: 'about',
    },
    {
      path: '/:locale(fa|ar|tr)?/contact',
      component: () => import('@/pages/ContactPage.vue'),
      name: 'contact',
    },
    {
      path: '/:locale(fa|ar|tr)?/docs',
      component: () => import('@/pages/DocsIndexPage.vue'),
      name: 'docs',
    },
    {
      path: '/:locale(fa|ar|tr)?/docs/:slug(.*)+',
      component: () => import('@/pages/DocPage.vue'),
      name: 'doc',
    },
    {
      path: '/:pathMatch(.*)*',
      component: () => import('@/pages/NotFoundPage.vue'),
      name: 'not-found',
    },
  ],
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition || { top: 0 }
  },
})

// Sync locale from route param on each navigation
router.beforeEach((to) => {
  const locale = (to.params.locale as string) || 'en'
  if (i18n.global.locale.value !== locale) {
    i18n.global.locale.value = locale
  }
})

export default router
