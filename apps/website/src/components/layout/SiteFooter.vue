<template>
  <footer class="site-footer">
    <div class="site-container">
      <!-- Top: Logo + tagline + Newsletter -->
      <div class="footer-top">
        <div class="footer-brand">
          <AppLogo :height="45" color="#fff" />
          <p class="footer-tagline">{{ $t('footer.tagline') }}</p>
        </div>
        <div class="footer-newsletter">
          <h5>{{ $t('footer.newsletter_title') }}</h5>
          <p class="newsletter-desc">{{ $t('footer.newsletter_desc') }}</p>
          <form class="newsletter-form" @submit.prevent="onSubscribe">
            <div class="newsletter-input-wrap">
              <v-icon size="18" class="newsletter-icon">mdi-email-outline</v-icon>
              <input
                v-model="email"
                type="email"
                :placeholder="$t('footer.newsletter_placeholder')"
                class="newsletter-input"
                required
              />
            </div>
            <button type="submit" class="newsletter-btn" :class="{ subscribed }">
              <template v-if="subscribed">
                <v-icon size="16">mdi-check</v-icon>
                {{ $t('footer.newsletter_success') }}
              </template>
              <template v-else>
                {{ $t('footer.newsletter_btn') }}
                <v-icon size="16">mdi-arrow-right</v-icon>
              </template>
            </button>
          </form>
        </div>
      </div>

      <div class="footer-divider"></div>

      <!-- Links Grid -->
      <div class="footer-grid">
        <div class="footer-col">
          <h5>{{ $t('footer.product') }}</h5>
          <router-link :to="localePath('/features')">{{ $t('footer.features') }}</router-link>
          <router-link :to="localePath('/pricing')">{{ $t('pricing.title') }}</router-link>
          <span>{{ $t('footer.whats_new') }}</span>
          <span>{{ $t('footer.roadmap') }}</span>
        </div>

        <div class="footer-col">
          <h5>{{ $t('footer.resources') }}</h5>
          <router-link :to="localePath('/docs')">{{ $t('footer.documentation') }}</router-link>
          <router-link :to="localePath('/docs/getting-started')">{{ $t('footer.getting_started') }}</router-link>
          <router-link :to="localePath('/docs/api-reference')">{{ $t('footer.api_reference') }}</router-link>
          <span>{{ $t('footer.blog') }}</span>
        </div>

        <div class="footer-col">
          <h5>{{ $t('footer.company') }}</h5>
          <router-link :to="localePath('/about')">{{ $t('footer.about_us') }}</router-link>
          <router-link :to="localePath('/contact')">{{ $t('contact.title') }}</router-link>
          <span>{{ $t('footer.careers') }}</span>
          <span>{{ $t('footer.press') }}</span>
        </div>

        <div class="footer-col">
          <h5>{{ $t('footer.legal') }}</h5>
          <span>{{ $t('footer.privacy') }}</span>
          <span>{{ $t('footer.terms') }}</span>
        </div>
      </div>

      <div class="footer-divider"></div>

      <!-- Bottom bar -->
      <div class="footer-bottom">
        <span class="copyright">&copy; {{ new Date().getFullYear() }} Asoode. {{ $t('footer.rights') }}</span>
        <div class="footer-social">
          <a v-for="s in socials" :key="s.name" :href="s.url" :title="s.name" class="social-btn" :style="{ '--hover': s.color }">
            <v-icon size="18">{{ s.icon }}</v-icon>
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppLogo from '@/components/shared/AppLogo.vue'
import { useLocalePath } from '@/composables/useLocalePath'

const localePath = useLocalePath()
const email = ref('')
const subscribed = ref(false)

function onSubscribe() {
  if (email.value) {
    subscribed.value = true
    setTimeout(() => {
      subscribed.value = false
      email.value = ''
    }, 3000)
  }
}

const socials = [
  { name: 'Twitter', icon: 'mdi-twitter', url: '#', color: '#1DA1F2' },
  { name: 'LinkedIn', icon: 'mdi-linkedin', url: '#', color: '#0A66C2' },
  { name: 'GitHub', icon: 'mdi-github', url: '#', color: '#e8e6f0' },
  { name: 'Instagram', icon: 'mdi-instagram', url: '#', color: '#E4405F' },
]
</script>

<style scoped lang="scss">
.site-footer {
  background: #0c0820;
  color: #9e9bb0;
  padding: 64px 0 32px;
}

.footer-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 48px;
  flex-wrap: wrap;
}

.footer-brand {
  max-width: 300px;
  flex-shrink: 0;
}

.footer-tagline {
  margin: 14px 0 0;
  font-size: 0.88rem;
  line-height: 1.6;
  color: #706d82;
}

// Newsletter
.footer-newsletter {
  max-width: 420px;
  flex: 1;
  min-width: 280px;

  h5 {
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
    margin: 0 0 6px;
  }
}

.newsletter-desc {
  font-size: 0.82rem;
  color: #706d82;
  margin: 0 0 14px;
  line-height: 1.5;
}

.newsletter-form {
  display: flex;
  gap: 8px;

  @media (max-width: 480px) {
    flex-direction: column;
  }
}

.newsletter-input-wrap {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.newsletter-icon {
  position: absolute;
  left: 12px;
  color: #4a475e;
  pointer-events: none;
}

.newsletter-input {
  width: 100%;
  padding: 10px 14px 10px 38px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  color: #e8e6f0;
  font-size: 0.85rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s, background 0.2s;

  &::placeholder {
    color: #4a475e;
  }

  &:focus {
    border-color: rgba(89, 168, 239, 0.4);
    background: rgba(255, 255, 255, 0.06);
  }
}

.newsletter-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  background: #59a8ef;
  color: #0c0820;
  font-size: 0.84rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background 0.2s, transform 0.15s, box-shadow 0.2s;

  &:hover {
    background: #7dbdf5;
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(89, 168, 239, 0.25);
  }

  &.subscribed {
    background: #4caf50;
    color: #fff;
  }
}

.footer-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 40px 0;
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

.footer-col {
  display: flex;
  flex-direction: column;
  gap: 10px;

  h5 {
    font-size: 0.82rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #fff;
    margin: 0 0 4px;
  }

  a,
  span {
    font-size: 0.87rem;
    color: #706d82;
    text-decoration: none;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: #e8e6f0;
    }
  }
}

.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.copyright {
  font-size: 0.8rem;
  color: #4a475e;
}

.footer-social {
  display: flex;
  gap: 6px;
}

.social-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  color: #706d82;
  text-decoration: none;
  transition: background 0.25s, color 0.25s, transform 0.25s;

  &:hover {
    background: var(--hover);
    color: #fff;
    transform: translateY(-2px);
  }
}
</style>
