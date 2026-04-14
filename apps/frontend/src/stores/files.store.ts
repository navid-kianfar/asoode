import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  type ExplorerViewModel, type UploadViewModel, type OperationResult,
  OperationResultStatus, API,
  type NewFolderDto, type RenameDto, type DeleteDto,
} from '@asoode/shared';
import { httpService } from '@/services/http.service';

export const useFilesStore = defineStore('files', () => {
  const uploading = ref<UploadViewModel[]>([]);
  const attaching = ref<UploadViewModel[]>([]);
  const chatAttaching = ref<UploadViewModel[]>([]);

  async function myFiles(path?: string): Promise<OperationResult<ExplorerViewModel>> {
    return httpService.post<ExplorerViewModel>(API.FILES_MINE, { path });
  }

  async function sharedByMe(path?: string): Promise<OperationResult<ExplorerViewModel>> {
    return httpService.post<ExplorerViewModel>(API.FILES_SHARED_BY_ME, { path });
  }

  async function sharedByOthers(path?: string): Promise<OperationResult<ExplorerViewModel>> {
    return httpService.post<ExplorerViewModel>(API.FILES_SHARED_BY_OTHERS, { path });
  }

  async function newFolder(model: NewFolderDto): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.FILES_NEW_FOLDER, model);
  }

  async function rename(model: RenameDto): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.FILES_RENAME, model);
  }

  async function deleteFile(model: DeleteDto): Promise<OperationResult<boolean>> {
    return httpService.post<boolean>(API.FILES_DELETE, model);
  }

  async function upload(files: File[], path: string): Promise<UploadViewModel[]> {
    const uploads: UploadViewModel[] = files.map((file) => {
      const ext = file.name.split('.').pop() || '';
      const vm: UploadViewModel = {
        name: file.name,
        extensionLessName: file.name.replace(`.${ext}`, ''),
        extension: ext,
        size: file.size,
        uploading: true,
        progress: 0,
        file,
        success: false,
        failed: false,
        promise: Promise.resolve({} as any),
      };
      vm.promise = httpService.upload<boolean>(API.FILES_UPLOAD, file, { path }, (p) => {
        vm.progress = p;
      }).then((result) => {
        vm.uploading = false;
        vm.success = result.status === OperationResultStatus.Success;
        vm.failed = !vm.success;
        return result;
      });
      return vm;
    });
    uploading.value.push(...uploads);
    return uploads;
  }

  async function attach(files: File[], taskId: string): Promise<UploadViewModel[]> {
    const uploads: UploadViewModel[] = files.map((file) => {
      const ext = file.name.split('.').pop() || '';
      const vm: UploadViewModel = {
        name: file.name,
        extensionLessName: file.name.replace(`.${ext}`, ''),
        extension: ext,
        size: file.size,
        uploading: true,
        progress: 0,
        file,
        success: false,
        failed: false,
        promise: Promise.resolve({} as any),
      };
      vm.promise = httpService.upload<boolean>(`/tasks/${taskId}/attach`, file, {}, (p) => {
        vm.progress = p;
      }).then((result) => {
        vm.uploading = false;
        vm.success = result.status === OperationResultStatus.Success;
        vm.failed = !vm.success;
        return result;
      });
      return vm;
    });
    attaching.value.push(...uploads);
    return uploads;
  }

  async function attachChat(files: File[], recordId: string): Promise<UploadViewModel[]> {
    const uploads: UploadViewModel[] = files.map((file) => {
      const ext = file.name.split('.').pop() || '';
      const vm: UploadViewModel = {
        name: file.name,
        extensionLessName: file.name.replace(`.${ext}`, ''),
        extension: ext,
        size: file.size,
        uploading: true,
        progress: 0,
        file,
        success: false,
        failed: false,
        promise: Promise.resolve({} as any),
      };
      vm.promise = httpService.upload<boolean>(`/messenger/channel/${recordId}/attach`, file, {}, (p) => {
        vm.progress = p;
      }).then((result) => {
        vm.uploading = false;
        vm.success = result.status === OperationResultStatus.Success;
        vm.failed = !vm.success;
        return result;
      });
      return vm;
    });
    chatAttaching.value.push(...uploads);
    return uploads;
  }

  return { uploading, attaching, chatAttaching, myFiles, sharedByMe, sharedByOthers, newFolder, rename, deleteFile, upload, attach, attachChat };
});
