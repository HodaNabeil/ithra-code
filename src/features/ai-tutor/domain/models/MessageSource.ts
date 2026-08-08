export type MessageSourceDTO = {
  id: string;
  title: string;
  source?: string;
  relevanceScore: number;
  contentType?: string;
  lectureId?: string;
};
