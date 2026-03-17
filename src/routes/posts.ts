import { Router, Request, Response } from "express";
import { faker } from "@faker-js/faker";
import { randomUUID } from "crypto";
import { db } from "../data/store";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// GET /posts  — list with pagination, tag filter, and published filter
router.get("/", (req: Request, res: Response): void => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
  const tag = req.query.tag as string | undefined;
  const publishedOnly = req.query.published !== "false";

  let filtered = db.posts.filter((p) =>
    publishedOnly ? p.published : true
  );

  if (tag) {
    filtered = filtered.filter((p) => p.tags.includes(tag));
  }

  filtered.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const total = filtered.length;
  const data = filtered.slice((page - 1) * limit, page * limit);

  res.json({
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// GET /posts/:id
router.get("/:id", (req: Request, res: Response): void => {
  const post = db.posts.find((p) => p.id === req.params.id);

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  // Increment views
  post.views += 1;

  const author = db.users.find((u) => u.id === post.authorId);
  const { password: _, ...safeAuthor } = author ?? ({} as any);

  res.json({ ...post, author: safeAuthor });
});

// POST /posts  — requires auth
router.post(
  "/",
  authenticate,
  (req: AuthenticatedRequest, res: Response): void => {
    const { title, content, excerpt, tags, published, coverImage } = req.body;

    if (!title || !content) {
      res.status(400).json({ error: "title and content are required" });
      return;
    }

    const now = new Date().toISOString();
    const post = {
      id: randomUUID(),
      title,
      slug: faker.helpers.slugify(title).toLowerCase(),
      excerpt: excerpt ?? content.slice(0, 200),
      content,
      coverImage: coverImage ?? faker.image.urlPicsumPhotos({ width: 1200, height: 630 }),
      authorId: req.user!.id,
      tags: tags ?? [],
      published: published ?? false,
      views: 0,
      createdAt: now,
      updatedAt: now,
    };

    db.posts.push(post);
    res.status(201).json(post);
  }
);

// PUT /posts/:id  — requires auth, only author can update
router.put(
  "/:id",
  authenticate,
  (req: AuthenticatedRequest, res: Response): void => {
    const post = db.posts.find((p) => p.id === req.params.id);

    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }

    if (post.authorId !== req.user!.id) {
      res.status(403).json({ error: "Forbidden — you can only edit your own posts" });
      return;
    }

    const { title, content, excerpt, tags, published, coverImage } = req.body;

    if (title !== undefined) {
      post.title = title;
      post.slug = faker.helpers.slugify(title).toLowerCase();
    }
    if (content !== undefined) post.content = content;
    if (excerpt !== undefined) post.excerpt = excerpt;
    if (tags !== undefined) post.tags = tags;
    if (published !== undefined) post.published = published;
    if (coverImage !== undefined) post.coverImage = coverImage;

    post.updatedAt = new Date().toISOString();

    res.json(post);
  }
);

// DELETE /posts/:id  — requires auth, only author can delete
router.delete(
  "/:id",
  authenticate,
  (req: AuthenticatedRequest, res: Response): void => {
    const index = db.posts.findIndex((p) => p.id === req.params.id);

    if (index === -1) {
      res.status(404).json({ error: "Post not found" });
      return;
    }

    if (db.posts[index].authorId !== req.user!.id) {
      res.status(403).json({ error: "Forbidden — you can only delete your own posts" });
      return;
    }

    db.posts.splice(index, 1);
    res.status(204).send();
  }
);

export default router;
