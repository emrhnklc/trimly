import { File } from 'expo-file-system';

type LocalImage = {
  uri: string;
  mimeType?: string | null;
};

export function appendImageFile(
  formData: FormData,
  fieldName: string,
  photo: LocalImage,
  name: string,
) {
  const extension = photo.mimeType === 'image/png'
    ? 'png'
    : photo.mimeType === 'image/webp'
      ? 'webp'
      : 'jpg';
  const file = new File(photo.uri);
  formData.append(fieldName, file, `${name}-${Date.now()}.${extension}`);
}
