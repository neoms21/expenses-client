import { ref } from "vue";
import { defineStore } from "pinia";

export enum Dialogs {
  StatementsUpload,
}

export const useDialogStore = defineStore("dialogs", () => {
  const dialogsVisibility = ref<Record<Dialogs, boolean>>({ [Dialogs.StatementsUpload]: false });

  const setVisibility = (dialog: Dialogs, val?: boolean) => {
    dialogsVisibility.value[dialog] = val !== undefined ? val : !dialogsVisibility.value[dialog];
  };

  return { dialogsVisibility, setVisibility };
});
