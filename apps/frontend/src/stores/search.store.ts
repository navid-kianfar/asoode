import { defineStore } from 'pinia';
import { ref } from 'vue';
import { type SearchResultViewModel, type OperationResult, OperationResultStatus, API } from '@asoode/shared';
import { httpService } from '@/services/http.service';

export const useSearchStore = defineStore('search', () => {
  const results = ref<SearchResultViewModel | null>(null);
  const searching = ref(false);

  async function search(query: string): Promise<SearchResultViewModel | null> {
    searching.value = true;
    try {
      const result = await httpService.post<SearchResultViewModel>(API.SEARCH, { query });
      if (result.status === OperationResultStatus.Success) {
        results.value = result.data;
        return result.data;
      }
      return null;
    } finally {
      searching.value = false;
    }
  }

  return { results, searching, search };
});
