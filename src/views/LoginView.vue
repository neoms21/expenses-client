<template>
  <div class="min-h-[85vh] flex items-center justify-center px-4 py-8">
    <div class="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
      <!-- Header -->
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-3">
          <i class="pi pi-wallet text-2xl" />
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ isSignUp ? 'Create an account' : 'Welcome back' }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ isSignUp ? 'Sign up to start tracking your expenses' : 'Sign in to access your expenses dashboard' }}
        </p>
      </div>

      <!-- Success Notification -->
      <Message
        v-if="successMessage"
        severity="success"
        class="mb-5 text-sm"
        :closable="true"
        @close="successMessage = ''"
      >
        {{ successMessage }}
      </Message>

      <!-- Error Message -->
      <Message
        v-if="errorMessage"
        severity="error"
        class="mb-5 text-sm"
        :closable="true"
        @close="errorMessage = ''"
      >
        {{ errorMessage }}
      </Message>

      <!-- Google OAuth Button -->
      <button
        type="button"
        @click="handleGoogleSignIn"
        :disabled="isGoogleLoading || isSubmitting"
        class="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-650 font-medium transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <svg v-if="!isGoogleLoading" class="w-5 h-5 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.93 6.72-4.93z"
          />
        </svg>
        <i v-else class="pi pi-spin pi-spinner text-lg" />
        <span>{{ isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google' }}</span>
      </button>


      <p class="mt-6 text-center text-xs text-gray-400">
        Access is restricted to authorized accounts only.
      </p>
    </div>


  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ClientResponseError } from 'pocketbase';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();


const isSignUp = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const isSubmitting = ref(false);
const isGoogleLoading = ref(false);


onMounted(() => {
  if (authStore.isAuthenticated && authStore.isEmailAllowed()) {
    navigateToTarget();
    return;
  }
  if (route.query.error === 'unauthorized') {
    errorMessage.value = 'Your account is not authorized to access this application.';
  }
});


const navigateToTarget = async () => {
  let redirect = (route.query.redirect as string) || '/';
  if (!redirect || redirect === '/login' || redirect.startsWith('/login')) {
    redirect = '/';
  }
  try {
    const failure = await router.replace(redirect);
    if (failure) {
      window.location.assign(redirect);
    }
  } catch (err) {
    console.warn('router.replace failed, using window.location fallback:', err);
    window.location.assign(redirect);
  }
};

const handleGoogleSignIn = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  isGoogleLoading.value = true;
  try {
    await authStore.loginWithOAuth2('google');
    navigateToTarget();
  } catch (err: unknown) {
    console.error('Google OAuth error:', err);
    const pbErr = err instanceof ClientResponseError ? err : null;
    const errMessage = err instanceof Error ? err.message : '';

    if (errMessage.includes('Access denied')) {
      errorMessage.value = errMessage;
    } else if (
      errMessage.includes('OAuth2 provider is not enabled') ||
      errMessage.includes('not enabled')
    ) {
      errorMessage.value =
        'Google OAuth2 is not enabled in PocketBase. Please enable Google provider under PocketBase Admin > Collections > users > Edit > Auth Methods > OAuth2.';
    } else if (pbErr?.status === 400 || errMessage.includes('Failed to authenticate')) {
      errorMessage.value =
        'Access denied: Your Google account is not authorized to access this application. Please contact the administrator.';
    } else if (pbErr?.isAbort || errMessage.includes('abort')) {
      errorMessage.value = 'Sign-in window was closed.';
    } else {
      errorMessage.value = errMessage || 'Google sign-in failed.';
    }
  } finally {
    isGoogleLoading.value = false;
  }
};

</script>
