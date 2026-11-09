import React, { useRef, useState } from 'react'
import {
  AlertCircle,
  FileImage,
  ImagePlus,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { formatFileSize, validateImageFile } from './scannerUtils'
import { MAX_FILE_SIZE_MB, type UploadedScreenshot } from './types'

export interface ScreenshotUploadCardProps {
  screenshot: UploadedScreenshot | null
  onSelectScreenshot: (item: UploadedScreenshot | null) => void
  fileError: string | null
  onFileError: (error: string | null) => void
  disabled?: boolean
}

export const ScreenshotUploadCard: React.FC<ScreenshotUploadCardProps> = ({
  screenshot,
  onSelectScreenshot,
  fileError,
  onFileError,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = (file: File) => {
    const error = validateImageFile(file)
    if (error) {
      onFileError(error)
      return
    }

    onFileError(null)
    if (screenshot?.previewUrl) {
      URL.revokeObjectURL(screenshot.previewUrl)
    }

    const previewUrl = URL.createObjectURL(file)
    onSelectScreenshot({
      file,
      previewUrl,
      name: file.name,
      size: file.size,
      type: file.type || 'image/png',
    })
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (disabled) return

    const files = e.dataTransfer.files
    if (!files || files.length === 0) return

    if (files.length > 1) {
      onFileError('Please upload one screenshot image at a time.')
      return
    }

    processFile(files[0])
  }

  const handleBrowseClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const handleRemoveImage = () => {
    if (screenshot?.previewUrl) {
      URL.revokeObjectURL(screenshot.previewUrl)
    }
    onSelectScreenshot(null)
    onFileError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card className="p-5 sm:p-7 flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-3 mb-4 pb-4 border-b border-[var(--border-card)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#164E5A] text-[#35C6D9]">
              <ImagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-heading)]">
                Screenshot Upload
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Attach a screenshot of a suspicious message for visual reference
              </p>
            </div>
          </div>

          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#A6C5C1]/20 text-[var(--text-muted)] border border-[#A6C5C1]/30">
            Optional
          </span>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
          aria-label="Upload screenshot image"
        />

        {/* Drag-and-Drop Area OR Image Preview */}
        {!screenshot ? (
          <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all duration-200 ${
              isDragging
                ? 'border-[#159FB5] bg-[#159FB5]/10 scale-[1.01]'
                : fileError
                ? 'border-[#E07A5F]/60 bg-[#E07A5F]/5'
                : 'border-[var(--border-card)] bg-[var(--bg-main)] hover:border-[#159FB5]/60'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-[#159FB5]/15 text-[var(--text-accent)] flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>

            <p className="text-sm font-bold text-[var(--text-heading)] mb-1">
              Drag and drop a screenshot here
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              Supports PNG, JPG, JPEG, and WEBP (Max {MAX_FILE_SIZE_MB} MB)
            </p>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleBrowseClick}
              disabled={disabled}
              icon={<FileImage className="w-4 h-4 text-[#35C6D9]" />}
            >
              Browse Files
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Image Preview Container */}
            <div className="relative rounded-2xl overflow-hidden border border-[var(--border-card)] bg-[var(--bg-main)] p-3">
              <div className="max-h-60 overflow-hidden rounded-xl flex items-center justify-center bg-black/5 dark:bg-black/25">
                <img
                  src={screenshot.previewUrl}
                  alt={`Preview of ${screenshot.name}`}
                  className="max-h-56 w-auto object-contain rounded-lg"
                />
              </div>

              {/* File Info & Controls Bar */}
              <div className="mt-3 pt-3 border-t border-[var(--border-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-[#159FB5]/15 text-[var(--text-accent)] shrink-0">
                    <FileImage className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--text-heading)] truncate">
                      {screenshot.name}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {formatFileSize(screenshot.size)} &bull; Preview Ready
                    </p>
                  </div>
                </div>

                {/* Replace & Remove Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleBrowseClick}
                    disabled={disabled}
                    icon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Replace
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={handleRemoveImage}
                    disabled={disabled}
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* File Validation Error Alert */}
        {fileError && (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2.5 p-3 rounded-xl bg-[#E07A5F]/15 border border-[#E07A5F]/30 text-xs text-[#B8573D] dark:text-[#F3A58E]"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#E07A5F]" />
            <span>{fileError}</span>
          </div>
        )}
      </div>

      {/* Honest Preview Capability Note */}
      <p className="mt-4 pt-3 border-t border-[var(--border-card)] text-[11px] text-[var(--text-muted)] leading-relaxed">
        Image selection and preview are active in this step. Automated image analysis will be enabled once the AI engine is connected.
      </p>
    </Card>
  )
}
