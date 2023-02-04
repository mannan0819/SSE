<script setup lang="ts">
import { ref, onMounted } from 'vue'

const prompt = ref('')
const answer = ref('')

const getData = async () => {
  console.log(prompt.value)
  answer.value = '';
  const response = await fetch("http://localhost:3000/getData",{
    method: "Post",
    body: JSON.stringify({ prompt: prompt.value  }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  const data = response.body;
  if(!data) return;

  const reader = data.getReader();
  const decoder = new TextDecoder();
  let done = false;

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    if (value) {
      console.log(decoder.decode(value));
      const data = decoder.decode(value);
      answer.value += data;
    }
    done = readerDone;
  }

  return data;
};
</script>

<template>
  <div class="p-9">
    <div class="mb-6">
      <label
        for="large-input"
        class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
      >
        Input your prompt here
      </label>
      <input
        type="text"
        v-model="prompt"
        id="large-input"
        class="sm:text-md block w-full rounded-lg border border-gray-300 bg-gray-50 p-4 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
      />
      <button class="bg-zinc-900 hover:bg-slate-300 text-white font-bold py-2 px-4 rounded mt-2" 
      @click="getData">
        Submit
      </button>
    </div>
    <div class="block p-6 text-4xl font-medium text-gray-900 dark:text-white">
      {{ answer }}
    </div>
  </div>
</template>
