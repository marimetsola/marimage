import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import ImageViewer from '../components/ImageViewer'
import './Upload.css'

interface ImageResponse {
  id: number
  original_filename: string
  mime_type: string
  file_size: number
  uploaded_at: string
  url: string
  thumbnail_url: string
}

function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] =
    useState<ImageResponse | null>(null)
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copyStatus, setCopyStatus] = useState<
    'idle' | 'copied' | 'error'
  >('idle')

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.currentTarget.files?.[0] ?? null)
    setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!file) {
      setError('Please select an image.')
      return
    }

    const form = event.currentTarget
    const formData = new FormData()

    formData.append('file', file)

    setError('')
    setSubmitting(true)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data: unknown = await response.json().catch(() => null)

      if (!response.ok) {
        const detail =
          typeof data === 'object' &&
          data !== null &&
          'detail' in data
            ? data.detail
            : null

        setError(
          typeof detail === 'string' ? detail : 'Upload failed.',
        )
        return
      }

      setUploadedImage(data as ImageResponse)
      setIsImageViewerOpen(false)
      setCopyStatus('idle')
      setFile(null)
      form.reset()
    } catch (error) {
      console.error('Upload failed:', error)
      setError('Could not connect to the server.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCopyUrl() {
    if (!uploadedImage) {
      return
    }

    const imageUrl = new URL(
      uploadedImage.url,
      window.location.origin,
    ).toString()

    try {
      await navigator.clipboard.writeText(imageUrl)
      setCopyStatus('copied')
    } catch (error) {
      console.error('Could not copy URL:', error)
      setCopyStatus('error')
    }
  }

  function handleUploadAnother() {
    setIsImageViewerOpen(false)
    setUploadedImage(null)
    setFile(null)
    setError('')
    setCopyStatus('idle')
  }

  const uploadedImageUrl = uploadedImage
    ? new URL(uploadedImage.url, window.location.origin).toString()
    : ''

  const uploadedThumbnailUrl = uploadedImage
    ? new URL(
        uploadedImage.thumbnail_url,
        window.location.origin,
      ).toString()
    : ''

  return (
    <section className="upload-page">
      <div className="upload-content">
        {uploadedImage ? (
          <div className="upload-success">
            <h1>Image uploaded</h1>

            <button
              className="upload-result-preview"
              type="button"
              onClick={() => setIsImageViewerOpen(true)}
              aria-label={`View ${uploadedImage.original_filename} full size`}
            >
              <img
                className="upload-result-image"
                src={uploadedThumbnailUrl}
                alt=""
              />

              <span
                className="upload-result-filename"
                title={uploadedImage.original_filename}
              >
                {uploadedImage.original_filename}
              </span>
            </button>

            <div className="upload-url-field">
              <label htmlFor="uploaded-image-url">
                Image URL
              </label>

              <input
                id="uploaded-image-url"
                type="text"
                readOnly
                value={uploadedImageUrl}
                onFocus={(event) => event.currentTarget.select()}
              />
            </div>

            <p
              className={`upload-copy-feedback${
                copyStatus === 'idle' ? ' upload-copy-feedback-hidden' : ''
              }${copyStatus === 'error' ? ' upload-copy-feedback-error' : ''}`}
              role="status"
              aria-live="polite"
            >
              {copyStatus === 'copied'
                ? 'URL copied to clipboard.'
                : copyStatus === 'error'
                  ? 'Could not copy automatically. Select the URL above and copy it manually.'
                  : '\u00A0'}
            </p>

            <div className="upload-success-actions">
              <button
                className="button"
                type="button"
                onClick={handleCopyUrl}
              >
                {copyStatus === 'copied' ? 'Copied!' : 'Copy URL'}
              </button>

              <button
                className="button button-secondary"
                type="button"
                onClick={handleUploadAnother}
              >
                Upload another image
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1>Upload image</h1>

            <form className="upload-form" onSubmit={handleSubmit}>
              <label htmlFor="image-file">
                Choose an image
              </label>

              <input
                className="upload-file-input"
                id="image-file"
                name="file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={submitting}
              />

              {file && (
                <div className="upload-preview-container">
                  <p className="upload-filename">
                    {file.name}
                  </p>

                  {previewUrl && (
                    <div className="upload-preview-frame">
                      <img
                        className="upload-preview"
                        src={previewUrl}
                        alt="Selected image preview"
                      />
                    </div>
                  )}
                </div>
              )}

              <p
                className={`form-error${error ? '' : ' form-error-hidden'}`}
                aria-live="polite"
              >
                {error}
              </p>

              <button
                className="button upload-submit"
                type="submit"
                disabled={submitting || !file}
              >
                {submitting ? 'Uploading...' : 'Upload'}
              </button>
            </form>
          </>
        )}
      </div>

      {uploadedImage && isImageViewerOpen && (
        <ImageViewer
          src={uploadedImageUrl}
          alt={uploadedImage.original_filename}
          onClose={() => setIsImageViewerOpen(false)}
        />
      )}
    </section>
  )
}

export default Upload
