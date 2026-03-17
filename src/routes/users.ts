import { Router, Request, Response } from "express";
import { db } from "../data/store";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// GET /users  — public, list all users (no passwords)
router.get("/", (_req: Request, res: Response): void => {
  const users = db.users.map(({ password: _, ...u }) => u);
  res.json({ data: users, meta: { total: users.length } });
});

// GET /users/:id
router.get("/:id", (req: Request, res: Response): void => {
  const user = db.users.find((u) => u.id === req.params.id);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const { password: _, ...safeUser } = user;

  const posts = db.posts
    .filter((p) => p.authorId === user.id && p.published)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  res.json({ ...safeUser, posts });
});

// PATCH /users/me  — update own profile, requires auth
router.patch(
  "/me",
  authenticate,
  (req: AuthenticatedRequest, res: Response): void => {
    const user = db.users.find((u) => u.id === req.user!.id);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const { name, bio, avatarUrl } = req.body;

    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  }
);

export default router;
