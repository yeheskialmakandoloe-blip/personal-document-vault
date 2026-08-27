export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function isImagePreview(ext: string) {
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext.toLowerCase())
}

export function isPdfPreview(ext: string) {
  return ext.toLowerCase() === 'pdf'
}

export function isTextPreview(ext: string) {
  return ['txt', 'csv', 'md', 'json'].includes(ext.toLowerCase())
}

export function isOfficePreview(ext: string) {
  return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext.toLowerCase())
}
