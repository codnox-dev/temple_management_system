import { post } from '@/api/api'

export interface SignedUploadRequestPayload {
  filename: string
  content_type?: string
}

export interface SignedUploadPayload {
  upload_url: string
  api_key: string
  cloud_name: string
  signature: string
  timestamp: number
  public_id: string
  object_path: string
  asset_url: string
  secure_url: string
  expires_at: number
  resource_type: string
  params: Record<string, string>
  allowed_extensions: string[]
  max_file_bytes: number
}

export interface CloudinaryUploadResult {
  asset_id: string
  public_id: string
  secure_url: string
  bytes: number
  format: string
  version: number | string
  [key: string]: unknown
}

export const requestSignedUpload = async (
  endpoint: string,
  file: File
): Promise<SignedUploadPayload> => {
  const payload: SignedUploadRequestPayload = {
    filename: file.name,
  }

  if (file.type) {
    payload.content_type = file.type
  }

  return post<SignedUploadPayload, SignedUploadRequestPayload>(endpoint, payload)
}

export const uploadFileToCloudinary = async (
  signed: SignedUploadPayload,
  file: File
): Promise<CloudinaryUploadResult> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', signed.api_key)
  formData.append('signature', signed.signature)

  Object.entries(signed.params).forEach(([key, value]) => {
    formData.append(key, value)
  })

  const response = await fetch(signed.upload_url, {
    method: 'POST',
    body: formData,
  })

  const data = await response.json()

  if (!response.ok) {
    const errorMessage = data?.error?.message || data?.message || 'Cloudinary upload failed'
    throw new Error(errorMessage)
  }

  if (data?.public_id !== signed.public_id) {
    throw new Error('Cloudinary public_id mismatch')
  }

  return data as CloudinaryUploadResult
}
