import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";
import { db } from "../data/store";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";

const router = Router({ mergeParams: true });

// GET /posts/:postId/comments
router.get("/", (req: Request, res: Response): void => {
  const post = db.posts.find((p) => p.id === req.params.postId);

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const comments = db.comments
    .filter((c) => c.postId === req.params.postId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .map((c) => {
      const author = db.users.find((u) => u.id === c.authorId);
      const { password: _, ...safeAuthor } = author ?? ({} as any);
      return { ...c, author: safeAuthor };
    });

  res.json({ data: comments, meta: { total: comments.length } });
});

// POST /posts/:postId/comments  — requires auth
router.post(
  "/",
  authenticate,
  (req: AuthenticatedRequest, res: Response): void => {
    const post = db.posts.find((p) => p.id === req.params.postId);

    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }

    const { body } = req.body;
    if (!body) {
      res.status(400).json({ error: "body is required" });
      return;
    }

    const comment = {
      id: randomUUID(),
      postId: req.params.postId as string,
      authorId: req.user!.id,
      body,
      createdAt: new Date().toISOString(),
    };

    db.comments.push(comment);
    res.status(201).json(comment);
  }
);

// DELETE /posts/:postId/comments/:commentId  — requires auth, only author
router.delete(
  "/:commentId",
  authenticate,
  (req: AuthenticatedRequest, res: Response): void => {
    const index = db.comments.findIndex(
      (c) =>
        c.id === req.params.commentId && c.postId === req.params.postId
    );

    if (index === -1) {
      res.status(404).json({ error: "Comment not found" });
      return;
    }

    if (db.comments[index].authorId !== req.user!.id) {
      res
        .status(403)
        .json({ error: "Forbidden — you can only delete your own comments" });
      return;
    }

    db.comments.splice(index, 1);
    res.status(204).send();
  }
);

export default router;
