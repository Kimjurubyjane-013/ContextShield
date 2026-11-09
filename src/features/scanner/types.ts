export const MAX_MESSAGE_LENGTH = 5000
export const MIN_MESSAGE_LENGTH = 1
export const MAX_FILE_SIZE_MB = 5
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
] as const

export const ALLOWED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'] as const

export interface UploadedScreenshot {
  file: File
  previewUrl: string
  name: string
  size: number
  type: string
}

export interface ScannerValidationErrors {
  messageError: string | null
  fileError: string | null
}
