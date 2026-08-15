import { imageUrl } from '../api'

/** Convierte una imagen de la API en un item del grid Masonry.
 *  La altura es pseudo-determinística (no hay dimensiones en la DB)
 *  para que el layout sea estable entre renders. */
export function imageToMasonryItem(img, ownerName) {
  return {
    id: img.id,
    img: imageUrl(img.id),
    height: 260 + ((img.id * 37) % 300),
    title: img.name,
    description: img.description,
    ownerName,
    userId: img.userId,
  }
}
