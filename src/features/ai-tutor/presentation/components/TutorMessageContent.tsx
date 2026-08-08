'use client';

import React from 'react';

import { cn } from '@/lib/utils';

type TutorMessageContentProps = {
  content: string;
  className?: string;
};

function formatInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

function isBulletLine(line: string): boolean {
  return /^[-*•]\s+/.test(line.trim());
}

function isNumberedLine(line: string): boolean {
  return /^\d+\.\s+/.test(line.trim());
}

function stripListMarker(line: string): string {
  return line.trim().replace(/^([-*•]|\d+\.)\s+/, '');
}

export function TutorMessageContent({
  content,
  className,
}: TutorMessageContentProps) {
  const blocks = content.split(/\n{2,}/);

  return (
    <div className={cn('space-y-3 text-sm leading-7', className)}>
      {blocks.map((block, blockIndex) => {
        const lines = block.split('\n').filter((line) => line.trim().length > 0);

        if (lines.length === 0) {
          return null;
        }

        const isList = lines.every(
          (line) => isBulletLine(line) || isNumberedLine(line),
        );

        if (isList) {
          const isOrdered = lines.every((line) => isNumberedLine(line));
          const ListTag = isOrdered ? 'ol' : 'ul';

          return (
            <ListTag
              key={blockIndex}
              className={cn(
                'space-y-1.5 ps-5',
                isOrdered ? 'list-decimal' : 'list-disc',
              )}
            >
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{formatInline(stripListMarker(line))}</li>
              ))}
            </ListTag>
          );
        }

        return (
          <p key={blockIndex}>
            {lines.map((line, lineIndex) => (
              <React.Fragment key={lineIndex}>
                {lineIndex > 0 ? <br /> : null}
                {formatInline(line)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
