import React from 'react';
import { Course } from '@/types/course/course.types';

interface CourseRequirementsProps {
  requirements: Course['requirements'];
}

export function CourseRequirements({ requirements }: CourseRequirementsProps) {
  return (
    <div className="space-y-4 pt-2 font-sans mb-8">
      <h3 className="font-bold text-foreground text-xl md:text-2xl text-right">
        متطلبات
      </h3>
      <ul className="space-y-3">
        {requirements.map((req, index) => (
          <li
            key={index}
            className="flex items-start gap-3 text-sm text-muted-foreground"
          >
            <div className="w-4 h-4 flex items-center justify-center shrink-0 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
            </div>
            <span className="text-right flex-1">{req}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
