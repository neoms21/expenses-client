<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import axios from 'axios';
// Initialize a QueryClient
// const queryClient = new QueryClient();

// --- Mock API Call ---
// This simulates an asynchronous API call that takes a userId as a parameter.
// In a real application, this would be a fetch() call to your backend.
const fetchUserData = async (userId: number) => {
  try {
    const {
      data: { name, hair_color, skin_color, birth_year },
    } = await axios.get('https://swapi.py4e.com/api/people/' + userId);
    return {
      name,
      hair_color,
      skin_color,
      birth_year,
    };
  } catch (error) {
    console.log('🚀 ~ fetchUserData ~ error:', error);
    throw new Error(`User with ID ${userId} not found.`);
  }

  // // Simulate network delay
  // await new Promise((resolve) => setTimeout(resolve, 1000));

  // if (userId === null || userId === undefined) {
  //   throw new Error('User ID cannot be null or undefined.');
  // }

  // // Mock data based on userId
  // const users = {
  //   1: { id: 1, name: 'Alice Smith', email: 'alice@example.com', role: 'Admin' },
  //   2: { id: 2, name: 'Bob Johnson', email: 'bob@example.com', role: 'User' },
  //   3: { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', role: 'Guest' },
  // };

  // const user = users[userId];

  // if (!user) {
  //   throw new Error(`User with ID ${userId} not found.`);
  // }

  // return {id:};
};

// --- Composable Function ---
// This composable encapsulates the Vue Query logic for fetching user data.
// It accepts a reactive `userIdRef` (a ref) as a parameter.
function useUserData(userIdRef: typeof currentUserId) {
  console.log('🚀 ~ useUserData ~ userIdRef:', userIdRef.value);
  //   const fetchUser = () => {
  const queryResult = useQuery({
    // queryKey must be a reactive array
    queryKey: computed(() => ['user', userIdRef.value]),
    structuralSharing: false,
    // queryFn accesses the value of the ref
    queryFn: () => fetchUserData(userIdRef.value),
    // Query is enabled only if userIdRef.value is truthy
    enabled: computed(() => !!userIdRef.value),
    select: (data) => {
      console.log('select', data);
      return { ...data, fetchedAt: new Date().toISOString() };
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
    // cacheTime: 10 * 60 * 1000, // Data stays in cache for 10 minutes
  });

  // Destructure reactive properties from queryResult
  const { data, isLoading, isError, error, refetch } = queryResult;
  console.log('🚀 ~ //fetchUser ~ error:', error.value);
  //   };

  // Return the reactive properties
  return { data, isLoading, isError, error, refetch };
}

const currentUserId = ref(1);

// Use the composable with the reactive currentUserId

const { data, isLoading, isError, error, refetch } = useUserData(currentUserId);

// Function to update the user ID
const selectUser = (id) => {
  currentUserId.value = id;
};

// Provide the query client to the application
</script>

<template>
  <div
    class="min-h-screen bg-gray-100 p-8 font-inter text-gray-800 flex flex-col items-center justify-center"
  >
    <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
      <h1 class="text-3xl font-bold text-center mb-6 text-indigo-700">User Data Fetcher</h1>

      <div class="mb-6 flex space-x-4">
        <button
          @click="selectUser(1)"
          :class="`px-4 py-2 rounded-md font-semibold ${currentUserId === 1 ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-indigo-100'}`"
        >
          Fetch User 1
        </button>
        <button
          @click="selectUser(2)"
          :class="`px-4 py-2 rounded-md font-semibold ${currentUserId === 2 ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-indigo-100'}`"
        >
          Fetch User 2
        </button>
        <button
          @click="selectUser(3)"
          :class="`px-4 py-2 rounded-md font-semibold ${currentUserId === 3 ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-indigo-100'}`"
        >
          Fetch User 3
        </button>
        <button
          @click="selectUser(4980980)"
          :class="`px-4 py-2 rounded-md font-semibold ${currentUserId === 4 ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-indigo-100'}`"
        >
          Fetch User 4 (Error)
        </button>
      </div>

      <div class="mb-6">
        <button
          @click="refetch()"
          class="w-full px-4 py-2 rounded-md bg-green-500 text-white font-semibold hover:bg-green-600 shadow-md transition-colors duration-200"
        >
          Refetch Current User
        </button>
      </div>

      <div
        v-if="isLoading"
        class="text-center p-4 bg-blue-100 text-blue-800 rounded-md animate-pulse"
      >
        Loading user data...
      </div>

      <div v-else-if="isError" class="text-center p-4 bg-red-100 text-red-800 rounded-md">
        Error: {{ error?.message || 'An unknown error occurred' }}
      </div>

      <div v-else-if="data" class="p-4 bg-green-50 text-gray-900 rounded-md">
        <h3 class="text-xl font-semibold mb-2">User Details:</h3>
        <p><strong>ID:</strong> {{ data.hair_color }}</p>
        <p><strong>Name:</strong> {{ data.name }}</p>
        <p><strong>Email:</strong> {{ data.skin_color }}</p>
        <p><strong>Role:</strong> {{ data.birth_year }}</p>
        <p><strong>Fetched At:</strong> {{ data.fetchedAt }}</p>
      </div>
    </div>
  </div>
  <!-- </QueryClientProvider> -->
</template>
