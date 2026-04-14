import { useFilesStore } from '@/stores/files.store';
import type { UploadViewModel } from '@asoode/shared';

const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
const audioExts = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'wma'];
const videoExts = ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'webm', 'flv'];

const fileIcons: Record<string, string> = {
  pdf: 'mdi-file-pdf-box',
  doc: 'mdi-file-word',
  docx: 'mdi-file-word',
  xls: 'mdi-file-excel',
  xlsx: 'mdi-file-excel',
  ppt: 'mdi-file-powerpoint',
  pptx: 'mdi-file-powerpoint',
  zip: 'mdi-folder-zip',
  rar: 'mdi-folder-zip',
  '7z': 'mdi-folder-zip',
  txt: 'mdi-file-document',
  csv: 'mdi-file-delimited',
  json: 'mdi-code-json',
  xml: 'mdi-xml',
  html: 'mdi-language-html5',
  css: 'mdi-language-css3',
  js: 'mdi-language-javascript',
  ts: 'mdi-language-typescript',
  py: 'mdi-language-python',
};

function getExtension(file: string | File): string {
  const name = typeof file === 'string' ? file : file.name;
  return (name.split('.').pop() || '').toLowerCase();
}

export function useFileUpload() {
  const filesStore = useFilesStore();

  function upload(files: File[], path: string): Promise<UploadViewModel[]> {
    return filesStore.upload(files, path);
  }

  function attach(files: File[], taskId: string): Promise<UploadViewModel[]> {
    return filesStore.attach(files, taskId);
  }

  function attachChat(files: File[], recordId: string): Promise<UploadViewModel[]> {
    return filesStore.attachChat(files, recordId);
  }

  function isImage(file: string | File): boolean {
    return imageExts.includes(getExtension(file));
  }

  function isAudio(file: string | File): boolean {
    return audioExts.includes(getExtension(file));
  }

  function isVideo(file: string | File): boolean {
    return videoExts.includes(getExtension(file));
  }

  function getFileIcon(extension: string): string {
    const ext = extension.toLowerCase().replace('.', '');
    if (imageExts.includes(ext)) return 'mdi-file-image';
    if (audioExts.includes(ext)) return 'mdi-file-music';
    if (videoExts.includes(ext)) return 'mdi-file-video';
    return fileIcons[ext] || 'mdi-file';
  }

  return { upload, attach, attachChat, isImage, isAudio, isVideo, getFileIcon };
}
