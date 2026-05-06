export interface UploadOptions {
  filename: string;
  contentType: string;
}

export async function uploadFile(
  file: File,
  options: UploadOptions
): Promise<{ url: string; pathname: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('filename', options.filename);
  formData.append('contentType', options.contentType);

  const res = await fetch('/api/upload', { method: 'POST', body: formData });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to upload file');
  }

  return res.json();
}

export async function uploadMultipleFiles(
  files: File[],
  type: 'image' | 'music'
): Promise<Array<{ file: File; url: string; pathname: string }>> {
  const results = [];

  for (const file of files) {
    try {
      const contentType = type === 'image' ? file.type : 'audio/mpeg';
      const result = await uploadFile(file, {
        filename: `${type}/${Date.now()}-${file.name}`,
        contentType,
      });

      results.push({ file, url: result.url, pathname: result.pathname });
    } catch (error) {
      console.error(`[v0] Failed to upload ${file.name}:`, error);
    }
  }

  return results;
}
