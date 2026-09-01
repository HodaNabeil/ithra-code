'use client';

import React from 'react';
import { Logo } from '@/components/shared/header/Logo';
import { ProgressDropdown } from '../lecture-details/ProgressDropdown';

interface CourseLearningHeaderProps {
  courseTitle: string;
  completedCount: number;
  totalCount: number;
}

export function CourseLearningHeader({
  courseTitle,
  completedCount,
  totalCount,
}: CourseLearningHeaderProps) {
  return (
    <header className="site-header sticky top-0 z-50 w-full">
      <div className="container flex h-20 items-center justify-between gap-4">
        {/* Right Section: Logo and Course Title */}
        <div className="flex items-center gap-4">
          <Logo />
          <h1 className="text-sm font-bold text-white truncate max-w-100 sm:text-base">
            {courseTitle}
          </h1>
        </div>

        {/* Left Section: Progress, Review, Share */}
        <div className="flex items-center gap-1 md:gap-4">
          {/* Progress Dropdown */}
          <ProgressDropdown
            completedCount={completedCount}
            totalCount={totalCount}
          />
        </div>
      </div>
    </header>
  );
}
