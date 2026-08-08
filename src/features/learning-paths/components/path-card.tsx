import Image from 'next/image';
import { BookOpen, Layers } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@/components/shared/link';
import { APP_ROUTES } from '@/constants/enums';

import { PathListDTO } from '@/types/path/path.dto';

interface PathCardProps {
  path: PathListDTO;
}

export function PathCard({ path }: PathCardProps) {
  const pathUrl = `${APP_ROUTES.LEARNING_PATHS}/${path.slug}`;

  return (
    <li>
      <Link href={pathUrl} className="block h-full">
        <Card className="overflow-hidden hover:shadow-md transition-all duration-300 hover:border-primary/30 flex flex-col h-full gap-5">
          <div className="relative w-full aspect-video overflow-hidden">
            {path.thumbnailUrl ? (
              <Image
                src={path.thumbnailUrl}
                alt={path.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <BookOpen className="size-16 text-muted-foreground/30" />
              </div>
            )}
          </div>

          <CardContent className="flex flex-col flex-1 gap-2">
            <div className="space-y-2 mb-6">
              <h3 className="font-bold text-lg leading-tight line-clamp-2">
                {path.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {path.summary}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Category */}
              <Badge variant="outline" className="text-xs font-normal">
                {path.category}
              </Badge>

              {/* Tracks Count */}
              {path.tracks && path.tracks.length > 0 && (
                <Badge variant="outline" className="text-xs font-normal gap-1">
                  <Layers className="size-3" />
                  {path.tracks.length} مسارات فرعية
                </Badge>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between p-4 pt-0">
            <Button variant="default" className="w-full">
              استكشف المسار
            </Button>
          </CardFooter>
        </Card>
      </Link>
    </li>
  );
}
