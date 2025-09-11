<script setup lang="ts">
import { ref } from 'vue';

import { useToast } from 'primevue/usetoast';
import { Dialogs, useDialogStore } from '@/stores/dialogs';
import type { FileUploadUploadEvent } from 'primevue';
const visible = ref(true);
const toast = useToast();
const fileupload = ref();

const { dialogsVisibility } = useDialogStore();

const upload = () => {
  fileupload.value.upload();
};

const onUpload = (event: FileUploadUploadEvent) => {
  console.log('🚀 ~ onUpload ~ event:', event);
  toast.add({ severity: 'info', summary: 'Success', detail: 'File Uploaded', life: 3000 });
};
const onError = (event: FileUploadUploadEvent) => {
  console.log('🚀 ~ onUpload ~ event:', event);
  toast.add({ severity: 'error', summary: 'Error', detail: event.xhr.responseText, life: 3000 });
};
</script>

<template>
  <Dialog
    v-model:visible="dialogsVisibility[Dialogs.StatementsUpload]"
    modal
    header="Upload statement"
  >
    <Toast />
    <div class="card flex flex-wrap gap-6 items-center justify-between">
      <FileUpload
        ref="fileupload"
        mode="basic"
        name="file"
        url="http://127.0.0.1:5000/statements"
        accept=".csv,.pdf"
        :maxFileSize="1000000"
        @upload="onUpload"
        @error="onError"
      />
      <Button label="Upload" @click="upload" severity="secondary" />
    </div>
  </Dialog>
</template>
