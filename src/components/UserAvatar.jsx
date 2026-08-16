import { useEffect, useState } from 'react'
import { avatarUrl } from '../api'

/** Avatar de usuario con fallback a la inicial si no tiene o si el archivo da error/404. */
export function UserAvatar({ user, className = '' }) {
  const [failed, setFailed] = useState(false)
  const uid = user?.id ?? user?.userId

  useEffect(() => {
    setFailed(false)
  }, [uid, user?.avatarUrl])

  if (!user) return null

  const base = className ? `avatar ${className}` : 'avatar'

  if (user.avatarUrl && uid && !failed) {
    return (
      <span className={`${base} avatar-img`}>
        <img src={avatarUrl(uid)} alt="" onError={() => setFailed(true)} />
      </span>
    )
  }

  return <span className={base}>{user.nickname?.[0]?.toUpperCase()}</span>
}