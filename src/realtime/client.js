import * as signalR from '@microsoft/signalr'

const HUB_URL = '/hubs/feed'
const RECONNECT_DELAY_MS = 10_000

let connection = null
let startPromise = null
let retryTimer = null

// Bus de eventos local: los módulos se suscriben con onRealtime y reciben
// los eventos del hub ya normalizados a nombres cortos.
const listeners = new Map() // event -> Set<cb>

function emit(event, payload) {
  listeners.get(event)?.forEach((cb) => {
    try {
      cb(payload)
    } catch {
      // un listener no debe romper al resto
    }
  })
}

/** Se suscribe a un evento realtime. Devuelve una función para desuscribirse. */
export function onRealtime(event, cb) {
  if (!listeners.has(event)) listeners.set(event, new Set())
  listeners.get(event).add(cb)
  return () => listeners.get(event)?.delete(cb)
}

function buildConnection() {
  const conn = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL)
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build()

  // Nombres de método = contrato con RealtimeService del backend.
  conn.on('ImageUploaded', (image) => emit('image:uploaded', image))
  conn.on('ImageDeleted', (id) => emit('image:deleted', id))
  conn.on('UserUpdated', (user) => emit('user:updated', user))

  // withAutomaticReconnect reintenta solo; si se rinde, lo reintentamos
  // manualmente cada RECONNECT_DELAY_MS.
  conn.onclose(() => {
    if (retryTimer === null) {
      retryTimer = setTimeout(() => {
        retryTimer = null
        void ensureConnected()
      }, RECONNECT_DELAY_MS)
    }
  })

  return conn
}

/** Asegura que haya una conexión al hub (idempotente, singleton por pestaña). */
export function ensureConnected() {
  if (connection?.state === signalR.HubConnectionState.Connected) {
    return Promise.resolve()
  }
  if (startPromise) return startPromise

  connection = buildConnection()
  startPromise = connection
    .start()
    .then(() => {
      startPromise = null
      retryTimer = null
    })
    .catch((err) => {
      console.warn('[realtime] no se pudo conectar al hub:', err)
      startPromise = null
      if (retryTimer === null) {
        retryTimer = setTimeout(() => {
          retryTimer = null
          void ensureConnected()
        }, RECONNECT_DELAY_MS)
      }
    })
  return startPromise
}
