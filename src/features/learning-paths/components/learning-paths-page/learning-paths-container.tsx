import { PathListDTO } from '@/types/path/path.dto';

import { LearningPathsList } from './learning-paths-list';

interface LearningPathsContainerProps {
  paths: PathListDTO[];
}

export function LearningPathsContainer({ paths }: LearningPathsContainerProps) {
  return (
    <section>
      <div className="container space-y-8">
        <LearningPathsList paths={paths} />
      </div>
    </section>
  );
}
