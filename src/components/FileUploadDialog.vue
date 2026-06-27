<script setup lang="ts">
import { ref, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { Dialogs, useDialogStore } from '@/stores/dialogs';

const toast = useToast();
const { dialogsVisibility } = useDialogStore();
const apiUrl = import.meta.env.VITE_API_URL;

interface UploadFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

const filesList = ref<UploadFileItem[]>([]);
const isUploading = ref(false);
const MAX_FILE_SIZE = 1000000; // 1MB

const hasFiles = computed(() => filesList.value.length > 0);
const hasPendingOrFailed = computed(() =>
  filesList.value.some((f) => (f.status === 'pending' || f.status === 'error') && f.size <= MAX_FILE_SIZE)
);
const successCount = computed(() => filesList.value.filter((f) => f.status === 'success').length);
const totalCount = computed(() => filesList.value.length);

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const onFileSelect = (event: any) => {
  if (!event || !event.files) return;

  for (const file of event.files) {
    const isDuplicate = filesList.value.some(
      (f) => f.name === file.name && f.size === file.size
    );
    if (isDuplicate) continue;

    let status: 'pending' | 'error' = 'pending';
    let errorMsg: string | undefined = undefined;

    if (file.size > MAX_FILE_SIZE) {
      status = 'error';
      errorMsg = 'File size exceeds the 1MB limit.';
    }

    filesList.value.push({
      id: Math.random().toString(36).substring(2, 11),
      file,
      name: file.name,
      size: file.size,
      status,
      progress: 0,
      error: errorMsg,
    });
  }
};

const removeFile = (id: string) => {
  filesList.value = filesList.value.filter((f) => f.id !== id);
};

const clearAll = () => {
  filesList.value = [];
};

const clearCompleted = () => {
  filesList.value = filesList.value.filter((f) => f.status !== 'success');
};

const uploadFiles = async () => {
  const pendingFiles = filesList.value.filter(
    (f) => f.status === 'pending' || f.status === 'error'
  );

  const filesToUpload = pendingFiles.filter((f) => f.size <= MAX_FILE_SIZE);

  if (filesToUpload.length === 0) {
    if (pendingFiles.length > 0) {
      toast.add({
        severity: 'warn',
        summary: 'Cannot Upload',
        detail: 'Please remove files exceeding the 1MB limit.',
        life: 5000,
      });
    }
    return;
  }

  isUploading.value = true;

  // Mark all files going to be uploaded as uploading
  for (const fileItem of filesToUpload) {
    fileItem.status = 'uploading';
    fileItem.progress = 0;
    fileItem.error = undefined;
  }

  const formData = new FormData();
  for (const fileItem of filesToUpload) {
    formData.append('file', fileItem.file);
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Server responded with status ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response stream not supported by browser.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep partial line in buffer

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const update = JSON.parse(line);
          const filename = update.file;
          const status = update.status;

          const fileItem = filesToUpload.find((f) => f.name === filename);
          if (fileItem) {
            if (status === 'success') {
              fileItem.status = 'success';
              fileItem.progress = 100;
            } else {
              fileItem.status = 'error';
              fileItem.error = update.error || 'Server processing error';
              fileItem.progress = 0;
            }
          }
        } catch (e) {
          console.error('Error parsing streaming line:', line, e);
        }
      }
    }

    // Process trailing buffer data
    if (buffer.trim()) {
      try {
        const update = JSON.parse(buffer);
        const filename = update.file;
        const status = update.status;

        const fileItem = filesToUpload.find((f) => f.name === filename);
        if (fileItem) {
          if (status === 'success') {
            fileItem.status = 'success';
            fileItem.progress = 100;
          } else {
            fileItem.status = 'error';
            fileItem.error = update.error || 'Server processing error';
            fileItem.progress = 0;
          }
        }
      } catch (e) {
        console.error('Error parsing trailing buffer:', buffer, e);
      }
    }

    // Mark any files that didn't receive an update as error (just in case)
    for (const f of filesToUpload) {
      if (f.status === 'uploading') {
        f.status = 'error';
        f.error = 'No response status received from server';
      }
    }

  } catch (err: any) {
    console.error('Upload stream error:', err);
    // Mark all currently uploading files as failed
    for (const f of filesToUpload) {
      if (f.status === 'uploading') {
        f.status = 'error';
        f.error = err.message || 'Network request failed';
      }
    }
    toast.add({
      severity: 'error',
      summary: 'Upload Error',
      detail: err.message || 'Upload failed.',
      life: 5000,
    });
  } finally {
    isUploading.value = false;
  }

  const successCountVal = filesToUpload.filter((f) => f.status === 'success').length;
  const failCountVal = filesToUpload.filter((f) => f.status === 'error').length;

  if (successCountVal > 0 && failCountVal === 0) {
    toast.add({
      severity: 'success',
      summary: 'All Uploads Successful',
      detail: `Successfully processed ${successCountVal} statement(s).`,
      life: 5000,
    });
  } else if (successCountVal > 0 && failCountVal > 0) {
    toast.add({
      severity: 'warn',
      summary: 'Partial Success',
      detail: `Processed ${successCountVal} statement(s). ${failCountVal} failed.`,
      life: 5000,
    });
  } else if (failCountVal > 0) {
    toast.add({
      severity: 'error',
      summary: 'Upload Processing Failed',
      detail: `Failed to process ${failCountVal} statement(s).`,
      life: 5000,
    });
  }
};
</script>

<template>
  <Dialog
    v-model:visible="dialogsVisibility[Dialogs.StatementsUpload]"
    modal
    header="Upload statements"
    :style="{ width: '42rem' }"
    :breakpoints="{ '960px': '75vw', '641px': '90vw' }"
  >
    <Toast />

    <div class="flex flex-col gap-6 py-2">
      <!-- File Selector Component -->
      <div class="flex items-center justify-between gap-4">
        <FileUpload
          ref="fileupload"
          mode="basic"
          name="file"
          :multiple="true"
          accept=".csv,.pdf"
          :maxFileSize="MAX_FILE_SIZE"
          @select="onFileSelect"
          :auto="false"
          customUpload
          chooseLabel="Select Files"
          :disabled="isUploading"
          class="p-button-outlined"
        />

        <div class="flex gap-2" v-if="hasFiles">
          <Button
            v-if="filesList.some((f) => f.status === 'success')"
            label="Clear Completed"
            icon="pi pi-check-circle"
            severity="secondary"
            outlined
            size="small"
            @click="clearCompleted"
            :disabled="isUploading"
          />
          <Button
            label="Clear All"
            icon="pi pi-trash"
            severity="danger"
            outlined
            size="small"
            @click="clearAll"
            :disabled="isUploading"
          />
        </div>
      </div>

      <!-- File List Area -->
      <div
        v-if="hasFiles"
        class="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden max-h-80 overflow-y-auto"
      >
        <div
          v-for="fileItem in filesList"
          :key="fileItem.id"
          class="flex flex-col p-4 border-b border-surface-200 dark:border-surface-700 last:border-b-0 gap-2 hover:bg-surface-50 dark:hover:bg-surface-800/40 transition-colors"
        >
          <div class="flex items-center justify-between gap-4">
            <!-- Left part: Icon and File Info -->
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <i
                :class="[
                  'pi text-xl shrink-0',
                  fileItem.name.endsWith('.pdf') ? 'pi-file-pdf text-red-500' : 'pi-file-excel text-green-500',
                ]"
              />
              <div class="flex flex-col min-w-0">
                <span class="font-medium text-sm text-surface-900 dark:text-surface-0 truncate" :title="fileItem.name">
                  {{ fileItem.name }}
                </span>
                <span class="text-xs text-surface-500 dark:text-surface-400">
                  {{ formatSize(fileItem.size) }}
                </span>
              </div>
            </div>

            <!-- Right part: Status & Actions -->
            <div class="flex items-center gap-3 shrink-0">
              <!-- Pending Status -->
              <span v-if="fileItem.status === 'pending'" class="flex items-center gap-1.5 text-xs text-surface-500 font-medium">
                <i class="pi pi-clock text-xs" />
                Pending
              </span>

              <!-- Uploading Status -->
              <span v-else-if="fileItem.status === 'uploading'" class="flex items-center gap-1.5 text-xs text-blue-500 font-medium">
                <i class="pi pi-spin pi-spinner text-xs" />
                Processing...
              </span>

              <!-- Success Status -->
              <span v-else-if="fileItem.status === 'success'" class="flex items-center gap-1.5 text-xs text-green-500 font-medium">
                <i class="pi pi-check text-xs" />
                Success
              </span>

              <!-- Error Status -->
              <span v-else-if="fileItem.status === 'error'" class="flex items-center gap-1.5 text-xs text-red-500 font-medium" :title="fileItem.error">
                <i class="pi pi-exclamation-circle text-xs" />
                Failed
              </span>

              <!-- Remove Action -->
              <Button
                v-if="fileItem.status !== 'uploading'"
                icon="pi pi-times"
                severity="secondary"
                text
                rounded
                size="small"
                class="hover:text-red-500!"
                @click="removeFile(fileItem.id)"
                :disabled="isUploading"
              />
            </div>
          </div>

          <!-- Progress Bar (Only during upload) -->
          <ProgressBar
            v-if="fileItem.status === 'uploading'"
            mode="indeterminate"
            style="height: 4px"
          />

          <!-- Error Message (Only on error) -->
          <div
            v-if="fileItem.status === 'error' && fileItem.error"
            class="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 px-2.5 py-1.5 rounded border border-red-200 dark:border-red-900/50 mt-1"
          >
            {{ fileItem.error }}
          </div>
        </div>
      </div>

      <!-- Empty State Dropzone-like Area -->
      <div
        v-else
        class="border-2 border-dashed border-surface-300 dark:border-surface-700 rounded-lg p-8 flex flex-col items-center justify-center gap-3 text-center bg-surface-50/50 dark:bg-surface-900/20"
      >
        <i class="pi pi-upload text-4xl text-surface-400" />
        <div class="flex flex-col gap-1">
          <span class="font-medium text-surface-700 dark:text-surface-300">No files selected</span>
          <span class="text-xs text-surface-500 dark:text-surface-400">PDF and CSV files up to 1MB are supported</span>
        </div>
      </div>

      <!-- Summary and Main Action Buttons -->
      <div class="flex items-center justify-between border-t border-surface-200 dark:border-surface-700 pt-4 mt-2">
        <span class="text-xs text-surface-600 dark:text-surface-400">
          <span v-if="hasFiles">
            {{ successCount }} of {{ totalCount }} uploaded successfully
          </span>
        </span>

        <div class="flex gap-2">
          <Button
            label="Cancel"
            severity="secondary"
            text
            @click="dialogsVisibility[Dialogs.StatementsUpload] = false"
            :disabled="isUploading"
          />
          <Button
            :label="isUploading ? 'Uploading...' : 'Upload Files'"
            icon="pi pi-cloud-upload"
            @click="uploadFiles"
            :disabled="isUploading || !hasPendingOrFailed"
          />
        </div>
      </div>
    </div>
  </Dialog>
</template>
