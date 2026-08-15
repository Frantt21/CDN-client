import { useMemo } from 'react'

export function MasonrySkeleton({ count = 12 }) {
  const heights = useMemo(
    () => Array.from({ length: count }, (_, i) => 180 + ((i * 53) % 220)),
    [count],
  )

  return (
    <div className="skeleton-masonry" aria-hidden="true">
      {heights.map((h, i) => (
        <div key={i} className="skeleton-tile" style={{ height: h }} />
      ))}
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <main className="container">
      <div className="profile">
        <span className="skeleton-avatar" />
        <div style={{ flex: 1 }}>
          <div className="skeleton-line skeleton-line-lg" />
          <div className="skeleton-line" />
          <div className="skeleton-line" />
        </div>
      </div>
      <div style={{ marginTop: '1.5rem' }}>
        <MasonrySkeleton count={8} />
      </div>
    </main>
  )
}

export function DetailSkeleton() {
  return (
    <main className="container">
      <div className="skeleton-line" style={{ width: 140 }} />
      <div className="detail-hero">
        <div className="skeleton-tile" style={{ height: 420, flex: '1 1 60%' }} />
        <div style={{ flex: '1 1 40%' }}>
          <div className="skeleton-line skeleton-line-lg" />
          <div className="skeleton-line" />
          <div className="skeleton-line" />
        </div>
      </div>
      <MasonrySkeleton count={8} />
    </main>
  )
}