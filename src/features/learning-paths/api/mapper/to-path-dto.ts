import type { PathCategoryDTO } from '@/types/path/path.dto';
import type {
  PathListItem,
  PathListTrackItem,
  PathViewer,
} from '../dto/path-list.dto';
import type {
  PathDetailItem,
  PathDetailSectionItem,
  PathDetailTrackItem,
} from '../dto/path-detail.dto';
import {
  filterCourseForAudience,
  filterTrackForAudience,
} from '../policies/path-visibility.policy';
import type { DB_PathListItem } from '../repository/path-list.select';
import type { DB_PathDetailEntity } from '../repository/path-detail.select';

function mapTrackSummary(
  track: DB_PathListItem['tracks'][number],
  viewer: PathViewer,
): PathListTrackItem | null {
  if (!filterTrackForAudience(track, viewer)) {
    return null;
  }

  return {
    id: track.id,
    title: track.title,
  };
}

export function mapPathListItemToDTO(
  path: DB_PathListItem,
  viewer: PathViewer,
): PathListItem {
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
      .filter((track): track is PathListTrackItem => track !== null),
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

  const sections: PathDetailSectionItem[] = [];

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
