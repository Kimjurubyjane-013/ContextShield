import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  MAX_MESSAGE_LENGTH,
} from './types'

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(2)} MB`
}

export function validateImageFile(file: File): string | null {
  const fileNameLower = file.name.toLowerCase()
  const hasValidExtension = ALLOWED_IMAGE_EXTENSIONS.some(ext =>
    fileNameLower.endsWith(ext)
  )
  const hasValidMime = ALLOWED_IMAGE_MIME_TYPES.includes(
    file.type.toLowerCase() as (typeof ALLOWED_IMAGE_MIME_TYPES)[number]
  )

  if (!hasValidMime && !hasValidExtension) {
    return `Unsupported file format "${file.name}". Please upload a PNG, JPG, JPEG, or WEBP image.`
  }

  if (file.size === 0) {
    return `The selected file "${file.name}" is empty. Please choose a valid image.`
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File "${file.name}" (${formatFileSize(file.size)}) exceeds the ${MAX_FILE_SIZE_MB} MB size limit. Please choose a smaller image.`
  }

  return null
}

export function validateMessageInput(text: string): string | null {
  if (!text || text.trim().length === 0) {
    return 'Please enter or paste a message before running analysis.'
  }

  if (text.length > MAX_MESSAGE_LENGTH) {
    return `Message exceeds the maximum length of ${MAX_MESSAGE_LENGTH.toLocaleString()} characters.`
  }

  return null
}
