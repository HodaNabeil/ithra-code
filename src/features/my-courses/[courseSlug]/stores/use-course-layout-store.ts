import { create } from 'zustand';

const SIDEBAR_DEFAULT_WIDTH_CLASS =
  'w-[415px] max-w-full lg:max-w-[415px]';
const SIDEBAR_EXPANDED_WIDTH_CLASS = 'w-[70%] min-w-[300px] max-w-full';

export type ActiveLectureContext = {
  lectureId: string;
  lectureTitle: string;
  courseTitle?: string;
};

export type CourseLayoutStore = {
  activeCourseSlug: string | null;
  isSidebarOpen: boolean;
  isSidebarExpanded: boolean;
  activeLecture: ActiveLectureContext | null;
  initializeForCourse: (courseSlug: string) => void;
  setSidebarOpen: (open: boolean) => void;
  closeSidebar: () => void;
  toggleSidebarExpanded: () => void;
  setActiveLecture: (lecture: ActiveLectureContext | null) => void;
};

export const useCourseLayoutStore = create<CourseLayoutStore>((set, get) => ({
  activeCourseSlug: null,
  isSidebarOpen: true,
  isSidebarExpanded: false,
  activeLecture: null,
  initializeForCourse: (courseSlug) => {
    const { activeCourseSlug } = get();
    if (activeCourseSlug === courseSlug) return;

    set({
      activeCourseSlug: courseSlug,
      isSidebarOpen: true,
      isSidebarExpanded: false,
    });
  },
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleSidebarExpanded: () =>
    set((state) => ({ isSidebarExpanded: !state.isSidebarExpanded })),
  setActiveLecture: (lecture) => set({ activeLecture: lecture }),
}));

export function getSidebarContainerWidthClass(
  isSidebarOpen: boolean,
  isSidebarExpanded: boolean,
): string {
  if (!isSidebarOpen) return 'w-0 border-none';
  return isSidebarExpanded
    ? SIDEBAR_EXPANDED_WIDTH_CLASS
    : SIDEBAR_DEFAULT_WIDTH_CLASS;
}

export function getSidebarContentWidthClass(
  isSidebarExpanded: boolean,
): string {
  return isSidebarExpanded
    ? 'w-full min-w-0'
    : 'w-full min-w-0 max-w-[415px]';
}
