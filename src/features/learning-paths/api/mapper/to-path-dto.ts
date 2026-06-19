import type { PathCategoryDTO } from '@/types/path/path.dto';
import type {
  PathCatalogItem,
  PathCatalogTrackItem,
  PathViewer,
} from '../dto/path-catalog.dto';
import type {
  PathDetailItem,
  PathDetailSectionItem,
  PathDetailTrackItem,
} from '../dto/path-detail.dto';
import {
  filterCourseForAudience,
  filterTrackForAudience,
} from '../policies/path-visibility.policy';
import type { DB_PathCatalogItem } from '../repository/path-catalog.select';
import type { DB_PathDetailEntity } from '../repository/path-detail.select';

function mapTrackSummary(
  track: DB_PathCatalogItem['tracks'][number],
  viewer: PathViewer,
): PathCatalogTrackItem | null {
  if (!filterTrackForAudience(track, viewer)) {
    return null;
  }

  return {
    id: track.id,
    title: track.title,
  };
}

export function mapPathCatalogItemToDTO(
  path: DB_PathCatalogItem,
  viewer: PathViewer,
): PathCatalogItem {
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
    tracks: path.tracks
      .map((track) => mapTrackSummary(track, viewer))
      .filter((track): track is PathCatalogTrackItem => track !== null),
  };
}

function mapDetailTrack(
  track: DB_PathDetailEntity['tracks'][number],
  viewer: PathViewer,
): PathDetailTrackItem | null {
  if (!filterTrackForAudience(track, viewer)) {
    return null;
  }

  return {
    id: track.id,
    title: track.title,
    slug: track.slug,
    summary: track.shortDescription,
    thumbnailUrl: track.thumbnailUrl,
    category: track.category as unknown as PathCategoryDTO,
    icon: track.icon,
    courses: track.courses
      .filter((course) => filterCourseForAudience(course, viewer))
      .map((course) => ({
        id: course.id,
        title: course.title,
        slug: course.slug,
        thumbnailUrl: course.thumbnailUrl,
        price: Number(course.price),
        level: course.level,
        hours: course.duration ? course.duration / 60 : null,
      })),
  };
}

export function mapPathDetailEntityToDTO(
  path: DB_PathDetailEntity,
  viewer: PathViewer,
): PathDetailItem {
  const tracks = path.tracks
    .map((track) => mapDetailTrack(track, viewer))
    .filter((track): track is PathDetailTrackItem => track !== null);

  const sections: PathDetailSectionItem[] = path.pathSections.map((section) => ({
    id: section.id,
    type: section.type as PathDetailSectionItem['type'],
    content: section.content,
    order: section.order,
  }));

  return {
    id: path.id,
    title: path.title,
    slug: path.slug,
    tagline: path.tagline,
    summary: path.shortDescription,
    description: path.description,
    thumbnailUrl: path.thumbnailUrl,
    category: path.category as unknown as PathCategoryDTO,
    icon: path.icon,
    isPublished: path.isPublished,
    metaTitle: path.metaTitle,
    metaDescription: path.metaDescription,
    createdAt: path.createdAt.toISOString(),
    updatedAt: path.updatedAt.toISOString(),
    tracks,
    sections,
  };
}
