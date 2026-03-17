import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { faker } from "@faker-js/faker";
import { randomUUID } from "crypto";
import { db } from "../data/store";
import { JWT_SECRET, authenticate, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// POST /auth/register
router.post("/register", (req: Request, res: Response): void => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: "name, email, and password are required" });
    return;
  }

  if (db.users.find((u) => u.email === email.toLowerCase())) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const user = {
    id: randomUUID(),
    name,
    email: email.toLowerCase(),
    password, // mock — no hashing
    avatarUrl: faker.image.avatar(),
    bio: "",
    createdAt: new Date().toISOString(),
  };

  db.users.push(user);

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "24h",
  });
  const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, {
    expiresIn: "7d",
  });

  const { password: _, ...safeUser } = user;
  res.status(201).json({ user: safeUser, token, refreshToken });
});

// POST /auth/login
router.post("/login", (req: Request, res: Response): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const user = db.users.find(
    (u) => u.email === email.toLowerCase() && u.password === password
  );

  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "24h",
  });
  const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, {
    expiresIn: "7d",
  });

  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser, token, refreshToken });
});

// POST /auth/refresh
router.post("/refresh", (req: Request, res: Response): void => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ error: "refreshToken is required" });
    return;
  }

  try {
    const payload = jwt.verify(refreshToken, JWT_SECRET) as { id: string };
    const user = db.users.find((u) => u.id === payload.id);

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "24h",
    });

    res.json({ token });
  } catch {
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

// POST /auth/logout  (mock — stateless, just acknowledge)
router.post("/logout", authenticate, (_req: Request, res: Response): void => {
  res.json({ message: "Logged out successfully" });
});

// GET /auth/me
router.get(
  "/me",
  authenticate,
  (req: AuthenticatedRequest, res: Response): void => {
    const user = db.users.find((u) => u.id === req.user!.id);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  }
);

export default router;
