import { HelpCircle } from 'lucide-react';
import React from 'react';
import { CourseSectionHeader } from './CourseSectionHeader';
import type { PrerequisiteDTO } from '@/types/course/course.dto';
import CourseCard from '../../components/CourseCard';

interface RequirementsProps {
  requirements?: string[];
  prerequisites?: PrerequisiteDTO[];
}

export const Requirements = ({
  requirements = [],
  prerequisites = [],
}: RequirementsProps) => {
  const hasRequirements = requirements.length > 0;
  const hasPrerequisites = prerequisites && prerequisites.length > 0;

  if (!hasRequirements && !hasPrerequisites) return null;

  return (
    <section className="section-gap">
      <div className="container">
        <CourseSectionHeader
          title="المتطلبات الأساسية"
          subtitle="ما ينبغي عليك معرفته"
          icon={HelpCircle}
          iconClassName="text-orange-400"
          subtitleClassName="text-orange-400"
        />

        {hasRequirements && (
          <div className="mb-10 max-w-4xl">
            {requirements.map((req, index) => (
              <p key={index} className="text-foreground text-base max-w-2xl">
                {req}
              </p>
            ))}
          </div>
        )}

        {hasPrerequisites && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {prerequisites.map((course) => (
              <CourseCard
                key={course.id}
                course={{
                  ...course,
                  compareAtPrice: null,
                  level: '',
                  objectives: [],
                  rating: 0,
                  ratingCount: 0,
                  lecturesCount: 0,
                  hours: course.duration ? Math.round(course.duration / 60) : null,
                  createdAt: '',
                  updatedAt: '',
                  publishedAt: null,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
