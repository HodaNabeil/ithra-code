import { create } from 'zustand';

const SIDEBAR_WIDTH_CLASS = 'w-[415px] max-w-full lg:max-w-[415px]';
const SIDEBAR_MAX_WIDTH_CLASS = 'w-[70%] min-w-[300px] max-w-full';

export type CurrentLectureContext = {
  lectureId: string;
  lectureTitle: string;
  courseTitle?: string;
};

export type CourseLayoutStore = {
  activeCourseSlug: string | null;
  isSidebarOpen: boolean;
  isMaximized: boolean;
  currentLecture: CurrentLectureContext | null;
  ensureCourse: (courseSlug: string) => void;
  initializeLayout: (courseSlug: string) => void;
  setSidebarOpen: (open: boolean) => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  toggleMaximized: () => void;
  setCurrentLecture: (lecture: CurrentLectureContext | null) => void;
};

export const useCourseLayoutStore = create<CourseLayoutStore>((set, get) => ({
  activeCourseSlug: null,
  isSidebarOpen: true,
  isMaximized: false,
  currentLecture: null,
  ensureCourse: (courseSlug) => {
    const { activeCourseSlug } = get();
    if (activeCourseSlug === courseSlug) return;
    set({
      activeCourseSlug: courseSlug,
      isSidebarOpen: true,
      isMaximized: false,
    });
  },
  initializeLayout: (courseSlug) => {
    const { activeCourseSlug } = get();
    const courseChanged = activeCourseSlug !== courseSlug;

    if (!courseChanged) return;

    set({
      activeCourseSlug: courseSlug,
      isSidebarOpen: true,
      isMaximized: false,
    });
  },
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  toggleMaximized: () =>
    set((state) => ({ isMaximized: !state.isMaximized })),
  setCurrentLecture: (lecture) => set({ currentLecture: lecture }),
}));

export function getAsideWidthClass(
  isSidebarOpen: boolean,
  isMaximized: boolean,
): string {
  if (!isSidebarOpen) return 'w-0 border-none';
  return isMaximized ? SIDEBAR_MAX_WIDTH_CLASS : SIDEBAR_WIDTH_CLASS;
}

export function getSidebarInnerWidthClass(isMaximized: boolean): string {
  return isMaximized ? 'w-full min-w-0' : 'w-full min-w-0 max-w-[415px]';
}
