<template>
  <div class="auth-layout">
    <!-- Animated background -->
    <div class="auth-bg">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
    </div>

    <!-- Card container -->
    <div class="auth-container">
      <div class="auth-card">
        <!-- Logo -->
        <div class="auth-logo">
          <img src="/assets/images/asoode-logo.svg" alt="Asoode" class="logo-light" />
          <img src="/assets/images/asoode-logo-dark.svg" alt="Asoode" class="logo-dark" />
        </div>

        <!-- Content slot -->
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #7b68ee 0%, #6c5ce7 40%, #a29bfe 100%);
  padding: 24px;
}

.auth-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  animation: float 20s ease-in-out infinite;
}

.orb-1 {
  width: 500px;
  height: 500px;
  background: #ff6b9d;
  top: -10%;
  right: -5%;
  animation-delay: 0s;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: #4ecdc4;
  bottom: -10%;
  left: -5%;
  animation-delay: -7s;
}

.orb-3 {
  width: 300px;
  height: 300px;
  background: #ffd93d;
  top: 40%;
  left: 50%;
  animation-delay: -14s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(30px, -30px) scale(1.05); }
  50% { transform: translate(-20px, 20px) scale(0.95); }
  75% { transform: translate(10px, 40px) scale(1.02); }
}

.auth-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 480px;
}

.auth-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 40px 36px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 20px 60px -15px rgba(0, 0, 0, 0.2);
  animation: cardSlideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes cardSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.auth-logo {
  text-align: center;
  margin-bottom: 28px;

  img {
    height: 40px;
    object-fit: contain;
  }

  .logo-dark {
    display: none;
  }
}

// ─── Dark Mode ──────────────────────────────────────────────
:global(body.dark-mode) {
  .auth-layout {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%);
  }

  .auth-card {
    background: #1e1e2e;
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.3),
      0 20px 60px -15px rgba(0, 0, 0, 0.5);
  }

  .auth-logo {
    .logo-light { display: none; }
    .logo-dark { display: inline; }
  }
}

// ─── Tablet ─────────────────────────────────────────────────
@media (max-width: 600px) {
  .auth-layout {
    padding: 16px;
    align-items: flex-start;
    padding-top: 40px;
  }

  .auth-card {
    padding: 32px 24px;
    border-radius: 12px;
  }

  .orb-1 {
    width: 250px;
    height: 250px;
  }

  .orb-2 {
    width: 200px;
    height: 200px;
  }

  .orb-3 {
    width: 150px;
    height: 150px;
  }
}

// ─── Small Phone ────────────────────────────────────────────
@media (max-width: 400px) {
  .auth-layout {
    padding: 12px;
    padding-top: 24px;
  }

  .auth-card {
    padding: 24px 16px;
  }

  .auth-logo {
    margin-bottom: 20px;
    img { height: 32px; }
  }
}
</style>
