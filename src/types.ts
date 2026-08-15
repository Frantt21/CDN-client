// Espejo de los DTOs del backend (API/Models/Dtos)

export interface AuthResponse {
  userId: number
  nickname: string
  username: string
  role: string
  token: string
}

export interface UserDto {
  id: number
  nickname: string
  username: string
  role: string
  description: string | null
  createdAt: string
}

export interface ImageDto {
  id: number
  userId: number
  name: string
  description: string | null
  url: string
  contentType: string
  sizeBytes: number | null
  createdAt: string
}
