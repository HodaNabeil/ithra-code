import type {
  DB_PathListItem,
  DB_PathDetailItem,
} from '@/server/db/path.select';
import type {
  PathListDTO,
  PathDetailDTO,
  TrackDetailDTO,
} from '@/types/path/path.dto';
import { PathCategoryDTO } from '@/types/path/path.dto';

export function mapPathListToDTO(path: DB_PathListItem): PathListDTO {
  return {
    id: path.id,
    title: path.title,
    slug: path.slug,
    tagline: path.tagline,
    summary: path.shortDescription,
    thumbnailUrl: path.thumbnailUrl,
    category: path.category as unknown as PathCategoryDTO,
    icon: path.icon,
    isPublished: path.isPublished,
    createdAt: path.createdAt.toISOString(),
    updatedAt: path.updatedAt.toISOString(),
    tracks: path.tracks.map((track) => ({
      id: track.id,
      title: track.title,
    })),
  };
}

export function mapPathDetailToDTO(path: DB_PathDetailItem): PathDetailDTO {
  const tracks: TrackDetailDTO[] = path.tracks.map((track) => ({
    id: track.id,
    title: track.title,
    slug: track.slug,
    summary: track.shortDescription,
    description: track.description,
    thumbnailUrl: track.thumbnailUrl,
    category: track.category as unknown as PathCategoryDTO,
    icon: track.icon,
    courses: track.courses.map((course) => ({
      id: course.id,
      title: course.title,
      slug: course.slug,
      thumbnailUrl: course.thumbnailUrl,
      price: Number(course.price),
      level: course.level,
      hours: course.duration ? course.duration / 60 : null,
    })),
  }));

  return {
    ...mapPathListToDTO(path as DB_PathListItem),
    description: path.description,
    metaTitle: path.metaTitle,
    metaDescription: path.metaDescription,
    tracks,
    sections: [],
  };
}
