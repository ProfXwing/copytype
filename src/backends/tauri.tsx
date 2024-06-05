import { Backend } from './backends';
import { invoke } from '@tauri-apps/api';

interface ErrorData {
  message: string,
  code: number
}

enum Error {
  Io = 0,
  NoFileSelected = 1,
}

export class TauriBackend implements Backend {
  uploadBook = async () => {
    console.log('uploadBook2');
    invoke('upload_book').catch((errorData: ErrorData) => {
      const error = Error[errorData.code];
      console.log({
        error,
        ...errorData,
      });
    });
  };  
}