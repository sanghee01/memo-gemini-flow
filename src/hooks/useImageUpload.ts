
import { useState } from 'react';

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      setUploading(true);
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploading(false);
        resolve(result);
      };
      
      reader.readAsDataURL(file);
    });
  };

  const handleImagePaste = (e: ClipboardEvent): Promise<string | null> => {
    return new Promise((resolve) => {
      const items = e.clipboardData?.items;
      if (!items) {
        resolve(null);
        return;
      }

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            handleImageUpload(file).then(resolve);
            return;
          }
        }
      }
      resolve(null);
    });
  };

  return {
    uploading,
    handleImageUpload,
    handleImagePaste
  };
};
