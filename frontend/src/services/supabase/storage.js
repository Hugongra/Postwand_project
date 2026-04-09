/**
 * Rutas de Storage acordes a RLS típico: objeto bajo carpeta = UUID del usuario.
 *
 * ❌ .upload('video.mp4', file)
 * ✅ .upload(`${userId}/video.mp4`, file)
 */

/** ID del usuario logueado guardado por la app en localStorage (mismo que auth.users.id). */
export function getLoggedInUserIdFromStorage() {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    const u = JSON.parse(raw)
    return u?.id ?? null
  } catch {
    return null
  }
}

/**
 * @param {string} userId - UUID (auth.users.id / public.users.id)
 * @param {string} fileName - nombre del fichero (se sanitiza el path)
 * @returns {string} p.ej. "550e8400-e29b-41d4-a716-446655440000/mi-video.mp4"
 */
export function buildUserStoragePath(userId, fileName) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('buildUserStoragePath: se requiere userId (UUID del usuario)')
  }
  const base = String(fileName || 'file')
    .replace(/^.*[/\\]/, '')
    .replace(/^\.+/, '') || 'file'
  return `${userId}/${base}`
}

/**
 * Sube un fichero a un bucket usando siempre prefijo {userId}/...
 *
 * @param {object} params
 * @param {import('@supabase/supabase-js').SupabaseClient} params.supabase - cliente con sesión si RLS usa auth.uid()
 * @param {string} params.bucket - p.ej. 'post-videos'
 * @param {string} params.userId - UUID
 * @param {File|Blob} params.file
 * @param {string} [params.fileName] - por defecto file.name
 * @param {object} [params.options] - upsert, contentType, cacheControl, etc.
 */
export async function uploadFileToUserFolder({
  supabase,
  bucket,
  userId,
  file,
  fileName,
  options = {},
}) {
  if (!supabase) {
    throw new Error('uploadFileToUserFolder: falta cliente supabase')
  }
  const name = fileName || file?.name || `upload-${Date.now()}`
  const path = buildUserStoragePath(userId, name)

  const { upsert, contentType, ...rest } = options
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: upsert ?? false,
    contentType: contentType ?? file?.type,
    ...rest,
  })

  return { data, error, path }
}

/** URL pública si el bucket es público. */
export function getStoragePublicUrl(supabase, bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data?.publicUrl ?? null
}
