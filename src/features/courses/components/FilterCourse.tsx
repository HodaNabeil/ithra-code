'use client';
import React from 'react';
import type { PathListDTO } from '@/types/path/path.dto';
import { CoursesSearch } from './courses-search';
import { CoursesFilters } from './courses-filters';

type FilterCourseProps = {
  selectedCategory: string;
  paths: PathListDTO[];
};

export function FilterCourse({ paths }: FilterCourseProps) {
  return (
    <section>
      <div className="container">
        <div className="mx-auto mb-8 flex max-w-4xl flex-col gap-3 md:flex-row">
          <CoursesSearch />
          <CoursesFilters paths={paths} />
        </div>
      </div>
    </section>
  );
}
