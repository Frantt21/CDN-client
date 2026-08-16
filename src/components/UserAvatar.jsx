import { useEffect, useState } from 'react'
import { avatarUrl } from '../api'
import { getImageStyle } from '../utils/imagePosition'

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
        {/* Capa de recorte interna (como FastChange): el <img> queda en layout
            block y su width/height z*100% + translate no se ven alterados por
            el flex del contenedor (flex-shrink rompía el zoom y la posición). */}
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

  return <span className={base}>{user.nickname?.[0]?.toUpperCase()}</span>
}