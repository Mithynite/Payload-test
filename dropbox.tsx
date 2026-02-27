import React, { ReactNode, useRef, useState } from 'react'

import { FileText, X, Upload } from 'lucide-react'

import { cn } from '@/lib/utils/cn'
import { buildFileTypeString, calculateMaxFileSize, mapAcceptableFileTypes } from '@/lib/helpers/file-information-helper'

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

interface IDropboxProps extends React.HTMLAttributes<HTMLElement> {
  placeholder?: {
    emptyPlaceholder?: ReactNode
    dropingPlaceholder?: ReactNode
    emptyMobilePlaceholder?: ReactNode
  }
  name?: string | undefined
  maxFileSize: number
  fileSizeUnits: string
  mimeTypes: string[]
  value?: File | null
  required?: boolean
  onFileChange?: (file: File | null) => void
}

export default function Dropbox({
  className,
  required = false,
  placeholder = {
    dropingPlaceholder: 'Pusťte soubor zde',
    emptyPlaceholder: 'Přetáhnout nebo vybrat soubor',
    emptyMobilePlaceholder: 'Vybrat soubor',
  },
  name,
  maxFileSize,
  fileSizeUnits,
  mimeTypes,
  value,
  onFileChange,
  ...props
}: IDropboxProps) {

  const MAX_FILE_SIZE = calculateMaxFileSize(fileSizeUnits, maxFileSize)

  const allowedFileTypes = mapAcceptableFileTypes(mimeTypes)
  const fileTypeString = buildFileTypeString(mimeTypes)

  const [fileState, setFileState] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const file = value !== undefined ? value : fileState

  const isAcceptableFile = (file: File) => allowedFileTypes.some(t => t === file.type)

  const validateFile = (file: File): boolean => {
    if (!isAcceptableFile(file)) {
      setError(`Soubor musí být ve formátu ${fileTypeString}`)
      return false
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`Soubor nesmí být větší než ${MAX_FILE_SIZE} ${fileSizeUnits}`)
      return false
    }
    setError(null)
    return true
  }

  const updateFile = (newFile: File | null) => {
    if (value === undefined) {
      setFileState(newFile) // uncontrolled mode
    }
    if (inputRef.current) {
      const dt = new DataTransfer()
      if (newFile) {
        dt.items.add(newFile)
      }
      inputRef.current.files = dt.files
    }
    onFileChange?.(newFile) // always notify parent
  }

  const handleFileDrop = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile && validateFile(selectedFile)) {
      updateFile(selectedFile)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    if (file) return

    const droppedFile = event.dataTransfer.files?.[0]
    if (droppedFile && validateFile(droppedFile)) {
      updateFile(droppedFile)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!file) setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleRemoveFile = (event: React.MouseEvent) => {
    event.stopPropagation()
    updateFile(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div
      className={cn(
        'relative transform border-1 px-[30px] py-[30px] text-center transition-all duration-300 ease-in-out focus-within:ring-[3px] focus-within:ring-ring/50',
        'aria-invalid:ring-destructive-foreground dark:aria-invalid:ring-destructive-foreground aria-invalid:border-destructive-foreground aria-invalid:bg-destructive/40',
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
        {
          'ring-destructive-foreground dark:ring-destructive-foreground border-destructive-foreground bg-destructive/40':
            error,
        },
        isDragging
          ? 'scale-[1.02] bg-white/10 ring-[2px] ring-primary-foreground backdrop-blur-2xl'
          : file
            ? `scale-100`
            : 'scale-100',
        file ? 'cursor-default' : 'cursor-pointer',
        className,
      )}
      onClick={() => !file && inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      {...props}
    >
      <input
        name={name}
        ref={inputRef}
        type="file"
        onChange={handleFileDrop}
        className="hidden"
        accept="application/pdf"
      />

      <div
        className={cn('transition-all duration-300', {
          'scale-110': isDragging,
        })}
      >
        {!file ? (
          <>
            <Upload
              className={cn(
                'mb-[10px] inline-flex h-8 w-8 items-center justify-center stroke-1 transition-colors duration-300',
                {
                  'stroke-muted': !isDragging,
                },
              )}
            />

            <p className={cn(`transition-colors duration-300 desktop:text-[26px]`)}>
              {isDragging ? (
                placeholder.dropingPlaceholder
              ) : required ? (
                <>
                  <span className="hidden text-muted desktop:inline">
                    {placeholder.emptyPlaceholder + ' *'}
                  </span>
                  <span className="text-muted desktop:hidden">
                    {placeholder.emptyMobilePlaceholder + ' *'}
                  </span>
                </>
              ) : (
                <>
                  <span className="hidden desktop:inline">{placeholder.emptyPlaceholder}</span>
                  <span className="desktop:hidden">{placeholder.emptyMobilePlaceholder}</span>
                </>
              )}
            </p>
            {error && <div className="text-destructive-foreground">{error}</div>}
          </>
        ) : (
          <div className="animate-in duration-300 fade-in-0 slide-in-from-bottom-4">
            <div className="mx-auto max-w-sm border border-white p-4 shadow-sm transition-colors duration-300 hover:bg-white/10">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 stroke-1 text-white" />
                <div className="flex min-w-0 flex-1 flex-col items-center">
                  <p className="max-w-[170px] truncate text-sm font-medium text-white">
                    {file.name}
                  </p>
                  <div className="mt-1 flex items-center justify-center gap-2 text-xs text-white">
                    <span>{formatFileSize(file.size)}</span>
                  </div>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="hover:text-destructive-foreground rounded-full p-[2px] text-white transition-colors duration-200 outline-none hover:bg-white"
                  aria-label="Smazat soubor"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
