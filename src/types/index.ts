export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  avatarUrl: string;
  bio: string;
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  authorId: string;
  tags: string[];
  published: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface AuthRequest extends Express.Request {
  user?: { id: string; email: string };
}
