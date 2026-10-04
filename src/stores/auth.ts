import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { pb } from '@/lib/dbClient';
import type { RecordModel } from 'pocketbase';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<RecordModel | null>(pb.authStore.record);
  const token = ref<string>(pb.authStore.token);
  const isAuthenticated = computed(() => !!token.value && pb.authStore.isValid);

  const userDisplayName = computed(() => {
    return user.value?.name || user.value?.email || pb.authStore.record?.email || 'User';
  });

  const userAvatarUrl = computed(() => {
    const current = user.value || pb.authStore.record;
    if (!current || !current.avatar) return null;
    return pb.files.getURL(current, current.avatar);
  });

  const isEmailAllowed = (email?: string): boolean => {
    const rawAllowed = import.meta.env.VITE_ALLOWED_EMAILS as string | undefined;
    if (!rawAllowed || !rawAllowed.trim()) {
      return true;
    }
    const targetEmail = email || user.value?.email || pb.authStore.record?.email;
    if (!targetEmail) {
      return false;
    }
    const allowedList = rawAllowed
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    return allowedList.includes(targetEmail.trim().toLowerCase());
  };

  pb.authStore.onChange((newToken, newRecord) => {
    token.value = newToken;
    user.value = newRecord;
  }, true);

  // Global response handler to clear state if unauthorized
  pb.afterSend = (response, data) => {
    if (response.status === 401 && pb.authStore.isValid) {
      logout();
    }
    return data;
  };

  const loginWithPassword = async (email: string, pass: string) => {
    if (!isEmailAllowed(email)) {
      throw new Error(`Access denied. ${email} is not authorized to access this application.`);
    }

    const authData = await pb.collection('users').authWithPassword(email, pass);
    if (!isEmailAllowed(authData.record.email)) {
      logout();
      throw new Error(`Access denied. ${authData.record.email} is not authorized to access this application.`);
    }

    user.value = authData.record;
    token.value = authData.token;
    return authData;
  };

  const loginWithOAuth2 = async (provider: string = 'google') => {
    const authData = await pb.collection('users').authWithOAuth2({ provider });
    if (!isEmailAllowed(authData.record.email)) {
      logout();
      throw new Error(`Access denied. ${authData.record.email} is not authorized to access this application.`);
    }

    user.value = authData.record;
    token.value = authData.token;
    return authData;
  };

  const register = async (email: string, pass: string, passConfirm: string, name?: string) => {
    if (!isEmailAllowed(email)) {
      throw new Error(`Access denied. ${email} is not authorized to register.`);
    }

    await pb.collection('users').create({
      email,
      password: pass,
      passwordConfirm: passConfirm,
      name: name || '',
    });
    return await loginWithPassword(email, pass);
  };

  const requestPasswordReset = async (email: string) => {
    return await pb.collection('users').requestPasswordReset(email);
  };

  const logout = () => {
    pb.authStore.clear();
    user.value = null;
    token.value = '';
  };

  const refreshAuth = async () => {
    if (!pb.authStore.isValid) return;
    const currentEmail = user.value?.email || pb.authStore.record?.email;
    if (currentEmail && !isEmailAllowed(currentEmail)) {
      logout();
      return;
    }

    try {
      const authData = await pb.collection('users').authRefresh();
      if (!isEmailAllowed(authData.record.email)) {
        logout();
        return;
      }
      user.value = authData.record;
      token.value = authData.token;
    } catch (error) {
      console.error('Failed to refresh auth session:', error);
      logout();
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    userDisplayName,
    userAvatarUrl,
    isEmailAllowed,
    loginWithPassword,
    loginWithOAuth2,
    register,
    requestPasswordReset,
    logout,
    refreshAuth,
  };
});
