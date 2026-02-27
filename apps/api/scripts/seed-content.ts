/**
 * Seed script: reads all JSON files from scripts/seed-content/ and inserts them
 * into the page_content and blog_posts tables.
 *
 * Usage:
 *   cd apps/api && npx tsx scripts/seed-content.ts
 *
 * Environment:
 *   DATABASE_URL — defaults to postgresql://zkira:zkira_s3cure_2026!@localhost:5432/zkira
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../src/db/schema.js';

const SEED_DIR = join(import.meta.dirname, 'seed-content');

const connectionString =
  process.env.DATABASE_URL || 'postgresql://zkira:zkira_s3cure_2026!@localhost:5432/zkira';

const client = postgres(connectionString, { max: 5 });
const db = drizzle(client, { schema });

// ─── Helpers ──────────────────────────────────────────────

/** Convert filename to slug: `features--stealth-payments.json` → `features/stealth-payments` */
function filenameToSlug(filename: string): string {
  return basename(filename, '.json').replace(/--/g, '/');
}

/** Extract a human-readable title from the content JSON */
function extractTitle(slug: string, content: any): string {
  if (slug === 'home') return 'Home';
  if (content.page_header?.title) return content.page_header.title;
  return slug
    .split('/')
    .pop()!
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c: string) => c.toUpperCase());
}

// ─── Seed Pages ───────────────────────────────────────────

async function seedPages() {
  const files = (await readdir(SEED_DIR)).filter(
    (f) => f.endsWith('.json') && f !== 'blog-posts.json'
  );

  console.log(`\n📄 Seeding ${files.length} pages...\n`);
  let inserted = 0;
  let updated = 0;

  for (const file of files) {
    const slug = filenameToSlug(file);
    const raw = await readFile(join(SEED_DIR, file), 'utf-8');
    const content = JSON.parse(raw);
    const title = extractTitle(slug, content);

    const now = new Date();

    const existing = await db
      .select({ slug: schema.pageContent.slug })
      .from(schema.pageContent)
      .where(eq(schema.pageContent.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(schema.pageContent)
        .set({
          title,
          content,
          updatedAt: now,
          updatedBy: 'seed-script',
        })
        .where(eq(schema.pageContent.slug, slug));
      updated++;
      console.log(`  ↻ Updated: ${slug}`);
    } else {
      await db.insert(schema.pageContent).values({
        slug,
        title,
        content,
        updatedAt: now,
        updatedBy: 'seed-script',
      });
      inserted++;
      console.log(`  ✓ Inserted: ${slug}`);
    }
  }

  console.log(`\n  Pages: ${inserted} inserted, ${updated} updated (${files.length} total)`);
}

// ─── Seed Blog Posts ──────────────────────────────────────

async function seedBlogPosts() {
  const blogFile = join(SEED_DIR, 'blog-posts.json');
  let posts: any[];

  try {
    const raw = await readFile(blogFile, 'utf-8');
    posts = JSON.parse(raw);
  } catch {
    console.log('\n📝 No blog-posts.json found, skipping blog seeding.');
    return;
  }

  if (!Array.isArray(posts) || posts.length === 0) {
    console.log('\n📝 blog-posts.json is empty, skipping blog seeding.');
    return;
  }

  console.log(`\n📝 Seeding ${posts.length} blog posts...\n`);
  let inserted = 0;
  let updated = 0;

  for (const post of posts) {
    const now = new Date();

    const existing = await db
      .select({ slug: schema.blogPosts.slug })
      .from(schema.blogPosts)
      .where(eq(schema.blogPosts.slug, post.slug))
      .limit(1);

    const values = {
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      author: post.author,
      tags: post.tags || [],
      readTime: post.readTime || null,
      published: post.published ?? true,
      publishedAt: post.publishedAt ? new Date(post.publishedAt) : now,
      createdAt: post.createdAt ? new Date(post.createdAt) : now,
      updatedAt: now,
      updatedBy: 'seed-script',
    };

    if (existing.length > 0) {
      await db
        .update(schema.blogPosts)
        .set({
          title: values.title,
          excerpt: values.excerpt,
          content: values.content,
          author: values.author,
          tags: values.tags,
          readTime: values.readTime,
          published: values.published,
          publishedAt: values.publishedAt,
          updatedAt: values.updatedAt,
          updatedBy: values.updatedBy,
        })
        .where(eq(schema.blogPosts.slug, post.slug));
      updated++;
      console.log(`  ↻ Updated: ${post.slug}`);
    } else {
      await db.insert(schema.blogPosts).values(values);
      inserted++;
      console.log(`  ✓ Inserted: ${post.slug}`);
    }
  }

  console.log(`\n  Blog posts: ${inserted} inserted, ${updated} updated (${posts.length} total)`);
}

// ─── Main ─────────────────────────────────────────────────

async function main() {
  console.log('🌱 PRIV Content Seed Script');
  console.log(`   Database: ${connectionString.replace(/:[^:@]+@/, ':***@')}`);
  console.log(`   Seed dir: ${SEED_DIR}`);

  try {
    await seedPages();
    await seedBlogPosts();
    console.log('\n✅ Seeding complete!\n');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
