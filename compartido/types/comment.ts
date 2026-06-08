export type EntityComment = {
  id: string;
  entityType: string;
  entityId: string;
  authorName: string;
  body: string;
  stars?: number | null;
  createdAt: string;
};

export type EntityCommentSummary = {
  totalCount: number;
  averageRating: number;
  distribution: Array<{
    stars: number;
    count: number;
    percentage: number;
  }>;
};
