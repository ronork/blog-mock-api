import { faker } from "@faker-js/faker";
import { User, Post, Comment } from "../types";

const TAGS = [
  "javascript",
  "typescript",
  "node",
  "react",
  "css",
  "devops",
  "ai",
  "career",
  "tutorial",
  "opinion",
];

function seedUsers(count = 10): User[] {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    password: "password123", // plaintext intentionally — this is a mock
    avatarUrl: faker.image.avatar(),
    bio: faker.lorem.sentence(),
    createdAt: faker.date.past({ years: 2 }).toISOString(),
  }));
}

function seedPosts(users: User[], count = 30): Post[] {
  return Array.from({ length: count }, () => {
    const title = faker.lorem.sentence({ min: 4, max: 10 }).replace(/\.$/, "");
    const now = faker.date.past({ years: 1 });
    return {
      id: faker.string.uuid(),
      title,
      slug: faker.helpers.slugify(title).toLowerCase(),
      excerpt: faker.lorem.paragraph(2),
      content: faker.lorem.paragraphs(6, "\n\n"),
      coverImage: faker.image.urlPicsumPhotos({ width: 1200, height: 630 }),
      authorId: faker.helpers.arrayElement(users).id,
      tags: faker.helpers.arrayElements(TAGS, { min: 1, max: 4 }),
      published: faker.datatype.boolean({ probability: 0.8 }),
      views: faker.number.int({ min: 0, max: 50000 }),
      createdAt: now.toISOString(),
      updatedAt: faker.date
        .between({ from: now, to: new Date() })
        .toISOString(),
    };
  });
}

function seedComments(users: User[], posts: Post[], count = 80): Comment[] {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    postId: faker.helpers.arrayElement(posts).id,
    authorId: faker.helpers.arrayElement(users).id,
    body: faker.lorem.sentences({ min: 1, max: 4 }),
    createdAt: faker.date.past({ years: 1 }).toISOString(),
  }));
}

// In-memory store — seeded once at startup
const users = seedUsers(10);
const posts = seedPosts(users, 30);
const comments = seedComments(users, posts, 80);

export const db = { users, posts, comments };
