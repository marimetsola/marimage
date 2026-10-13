import { useCallback, useEffect, useRef, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import ImageViewer from '../components/ImageViewer'
import './MyImages.css'

interface ImageResponse {
  id: number
  original_filename: string
  mime_type: string
  file_size: number
  uploaded_at: string
  url: string
  thumbnail_url: string
}

interface DeleteNotice {
  id: number
  filename: string
}

function DeleteToast({
  notice,
  onDismiss,
}: {
  notice: DeleteNotice
  onDismiss: (id: number) => void
}) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onDismiss(notice.id)
    }, 4000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [notice.id, onDismiss])

  return (
    <div className="delete-toast" role="status">
      <div className="delete-toast-message">
        <strong>Image deleted</strong>

        <span
          className="delete-toast-filename"
          title={notice.filename}
        >
          {notice.filename}
        </span>
      </div>

      <button
        className="delete-toast-close"
        type="button"
        aria-label={`Dismiss notification for ${notice.filename}`}
        onClick={() => onDismiss(notice.id)}
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function MyImages() {
  const [images, setImages] = useState<ImageResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewingImage, setViewingImage] = useState<ImageResponse | null>(null)

  const [copiedImageId, setCopiedImageId] = useState<number | null>(null)
  const [copyErrorId, setCopyErrorId] = useState<number | null>(null)

  const [pendingDelete, setPendingDelete] =
    useState<ImageResponse | null>(null)
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const [deleteNotices, setDeleteNotices] = useState<DeleteNotice[]>([])
  const nextDeleteNoticeId = useRef(1)

  const dismissDeleteNotice = useCallback((id: number) => {
    setDeleteNotices((currentNotices) =>
      currentNotices.filter((notice) => notice.id !== id),
    )
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function loadImages() {
      try {
        const response = await fetch('/api/images', {
          signal: controller.signal,
        })

        const data: unknown = await response.json().catch(() => null)

        if (!response.ok) {
          const detail =
            typeof data === 'object' &&
            data !== null &&
            'detail' in data &&
            typeof data.detail === 'string'
              ? data.detail
              : 'Could not load images.'

          throw new Error(detail)
        }

        if (!Array.isArray(data)) {
          throw new Error('Unexpected response from server.')
        }

        setImages(data as ImageResponse[])
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        console.error('Failed to load images:', error)

        setError(
          error instanceof Error
            ? error.message
            : 'Could not load images.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadImages()

    return () => {
      controller.abort()
    }
  }, [])

  async function handleCopyUrl(image: ImageResponse) {
    const imageUrl = new URL(
      image.url,
      window.location.origin,
    ).toString()

    setCopiedImageId(null)
    setCopyErrorId(null)

    try {
      await navigator.clipboard.writeText(imageUrl)
      setCopiedImageId(image.id)
    } catch (error) {
      console.error('Could not copy image URL:', error)
      setCopyErrorId(image.id)
    }
  }

  function openDeleteDialog(image: ImageResponse) {
    setPendingDelete(image)
    setDeleteError('')
  }

  function closeDeleteDialog() {
    if (deletingImageId !== null) {
      return
    }

    setPendingDelete(null)
    setDeleteError('')
  }

  async function handleDeleteImage() {
    if (!pendingDelete || deletingImageId !== null) {
      return
    }

    const imageToDelete = pendingDelete

    setDeletingImageId(imageToDelete.id)
    setDeleteError('')

    try {
      const response = await fetch(
        `/api/images/${imageToDelete.id}`,
        {
          method: 'DELETE',
        },
      )

      if (!response.ok) {
        const data: unknown = await response.json().catch(() => null)

        const detail =
          typeof data === 'object' &&
          data !== null &&
          'detail' in data &&
          typeof data.detail === 'string'
            ? data.detail
            : 'Could not delete image.'

        throw new Error(detail)
      }

      setImages((currentImages) =>
        currentImages.filter(
          (image) => image.id !== imageToDelete.id,
        ),
      )

      const noticeId = nextDeleteNoticeId.current
      nextDeleteNoticeId.current += 1

      setDeleteNotices((currentNotices) =>
        [
          ...currentNotices,
          {
            id: noticeId,
            filename: imageToDelete.original_filename,
          },
        ].slice(-3),
      )

      setCopiedImageId((currentId) =>
        currentId === imageToDelete.id ? null : currentId,
      )

      setCopyErrorId((currentId) =>
        currentId === imageToDelete.id ? null : currentId,
      )

      setPendingDelete(null)
    } catch (error) {
      console.error('Failed to delete image:', error)

      setDeleteError(
        error instanceof Error
          ? error.message
          : 'Could not delete image.',
      )
    } finally {
      setDeletingImageId(null)
    }
  }

  const isDeleting = pendingDelete !== null &&
    deletingImageId === pendingDelete.id

  return (
    <section className="images-page">
      <div className="images-content">
        <div className="images-heading">
          <h1>My Images</h1>

          {!loading && !error && (
            <span className="images-count">
              {images.length}{' '}
              {images.length === 1 ? 'image' : 'images'}
            </span>
          )}
        </div>

        {loading && <p>Loading images...</p>}

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && images.length === 0 && (
          <p className="images-empty">
            You haven't uploaded any images yet.
          </p>
        )}

        {!loading && !error && images.length > 0 && (
          <div className="image-grid">
            {images.map((image) => {
              const imageUrl = new URL(
                image.url,
                window.location.origin,
              ).toString()

              const thumbnailUrl = new URL(
                image.thumbnail_url,
                window.location.origin,
              ).toString()

              return (
                <article className="image-card" key={image.id}>

                  <button
                    className="image-card-preview"
                    type="button"
                    onClick={() => setViewingImage(image)}
                    aria-label={`View ${image.original_filename}`}
                  >
                    <img
                      className="image-card-thumbnail"
                      src={thumbnailUrl}
                      alt=""
                      loading="lazy"
                    />
                  </button>

                  <div className="image-card-details">
                    <h2 title={image.original_filename}>
                      {image.original_filename}
                    </h2>

                    <p className="image-metadata">
                      {formatDate(image.uploaded_at)}
                      <span aria-hidden="true"> · </span>
                      {formatFileSize(image.file_size)}
                    </p>

                    <label
                      className="image-url-label"
                      htmlFor={`image-url-${image.id}`}
                    >
                      Image URL
                    </label>

                    <div className="image-url-row">
                      <input
                        className="image-url-input"
                        id={`image-url-${image.id}`}
                        type="text"
                        readOnly
                        value={imageUrl}
                        onFocus={(event) =>
                          event.currentTarget.select()
                        }
                        onClick={(event) =>
                          event.currentTarget.select()
                        }
                        aria-label={`URL for ${image.original_filename}`}
                      />

                      <button
                        className="button image-copy-button"
                        type="button"
                        onClick={() => handleCopyUrl(image)}
                      >
                        {copiedImageId === image.id
                          ? 'Copied!'
                          : 'Copy URL'}
                      </button>
                    </div>

                    <p
                      className={`image-copy-feedback${
                        copiedImageId === image.id ||
                        copyErrorId === image.id
                          ? ''
                          : ' is-hidden'
                      }`}
                      aria-live="polite"
                    >
                      {copiedImageId === image.id
                        ? 'URL copied to clipboard.'
                        : copyErrorId === image.id
                          ? 'Copy failed. Select the URL to copy it manually.'
                          : '\u00A0'}
                    </p>

                    <button
                      className="image-delete-button"
                      type="button"
                      disabled={deletingImageId !== null}
                      onClick={() => openDeleteDialog(image)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {deleteNotices.length > 0 && (
        <div className="delete-toast-container" aria-label="Notifications">
          {deleteNotices.map((notice) => (
            <DeleteToast
              key={notice.id}
              notice={notice}
              onDismiss={dismissDeleteNotice}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete image?"
        message={
          pendingDelete
            ? `Are you sure you want to permanently delete "${pendingDelete.original_filename}"? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete image"
        cancelLabel="Cancel"
        busy={isDeleting}
        error={deleteError || undefined}
        onConfirm={handleDeleteImage}
        onCancel={closeDeleteDialog}
      />

      {viewingImage && (
        <ImageViewer
          src={new URL(
            viewingImage.url,
            window.location.origin,
          ).toString()}
          alt={viewingImage.original_filename}
          onClose={() => setViewingImage(null)}
        />
      )}

    </section>
  )
}

export default MyImages
