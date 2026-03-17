import express from "express";
import authRouter from "./routes/auth";
import postsRouter from "./routes/posts";
import commentsRouter from "./routes/comments";
import usersRouter from "./routes/users";
import { db } from "./data/store";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());

// Routes
app.use("/auth", authRouter);
app.use("/posts", postsRouter);
app.use("/posts/:postId/comments", commentsRouter);
app.use("/users", usersRouter);

// Health check + seed stats
app.get("/", (_req, res) => {
  res.json({
    name: "blog-api",
    status: "ok",
    seed: {
      users: db.users.length,
      posts: db.posts.length,
      comments: db.comments.length,
    },
    endpoints: {
      auth: ["POST /auth/register", "POST /auth/login", "POST /auth/refresh", "POST /auth/logout", "GET /auth/me"],
      posts: ["GET /posts", "GET /posts/:id", "POST /posts", "PUT /posts/:id", "DELETE /posts/:id"],
      comments: ["GET /posts/:postId/comments", "POST /posts/:postId/comments", "DELETE /posts/:postId/comments/:commentId"],
      users: ["GET /users", "GET /users/:id", "PATCH /users/me"],
    },
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`blog-api running on http://localhost:${PORT}`);
  console.log(`Seeded: ${db.users.length} users, ${db.posts.length} posts, ${db.comments.length} comments`);
});
