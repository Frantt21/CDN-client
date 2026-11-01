import { useEffect, useState } from 'react'
import { avatarUrl } from '../api'
import { getImageStyle } from '../utils/imagePosition'

/** Avatar de usuario con fallback a la inicial si no tiene o si el archivo da error/404.
 *  `ringColor`: color del anillo (borde) extraído de la imagen, opcional. */
export function UserAvatar({ user, className = '', ringColor }) {
  const [failed, setFailed] = useState(false)
  const uid = user?.id ?? user?.userId

  useEffect(() => {
    setFailed(false)
  }, [uid, user?.avatarUrl])

  if (!user) return null

  const base = className ? `avatar ${className}` : 'avatar'
  const ringStyle = ringColor ? { borderColor: ringColor } : undefined

  if (user.avatarUrl && uid && !failed) {
    return (
      <span className={`${base} avatar-img`} style={ringStyle}>
        <span className="avatar-clip">
          <img
            src={avatarUrl(uid)}
            alt=""
            style={user.avatarPosition ? getImageStyle(user.avatarPosition) : undefined}
            onError={() => setFailed(true)}
          />
        </span>
      </span>
    )
  }

  return <span className={base} style={ringStyle}>{user.nickname?.[0]?.toUpperCase()}</span>
}