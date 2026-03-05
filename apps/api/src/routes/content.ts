import { Hono } from 'hono';
import { timingSafeEqual } from 'node:crypto';
import { exec } from 'node:child_process';
import { db } from '../db/index.js';
import { pageContent, blogPosts } from '../db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import { loadConfig } from '../config.js';
import { verifyAdminToken } from '../middleware/jwt-auth.js';

const contentRoutes = new Hono();

// Admin auth middleware — JWT Bearer + legacy password
const adminAuth = async (c: any, next: any) => {
  const config = loadConfig();
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const payload = await verifyAdminToken(authHeader.slice(7), config.jwtSecret);
    if (payload) { await next(); return; }
  }
  const adminPassword = c.req.header('X-Admin-Password');
  if (!adminPassword) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const provided = Buffer.from(adminPassword);
    const expected = Buffer.from(config.adminPassword);
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
  } catch {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
};

// Apply admin auth to all admin routes
contentRoutes.use('/api/admin/*', adminAuth);

// ═══════════════════════════════════════════════════════════
// PUBLIC ENDPOINTS (no auth)
// ═══════════════════════════════════════════════════════════

// GET /api/content/pages - List all pages
contentRoutes.get('/api/content/pages', async (c) => {
  try {
    const pages = await db.select({
      slug: pageContent.slug,
      title: pageContent.title,
      seoTitle: pageContent.seoTitle,
      seoDescription: pageContent.seoDescription,
      updatedAt: pageContent.updatedAt,
      publishedAt: pageContent.publishedAt,
    }).from(pageContent).orderBy(pageContent.slug);

    return c.json(pages);
  } catch (error) {
    console.error('Failed to get pages:', error);
    return c.json({ error: 'Failed to get pages' }, 500);
  }
});

// GET /api/content/pages/all - Get ALL pages with full content (for build script)
contentRoutes.get('/api/content/pages/all', async (c) => {
  try {
    const pages = await db.select().from(pageContent).orderBy(pageContent.slug);
    return c.json({ pages });
  } catch (error) {
    console.error('Failed to get all pages:', error);
    return c.json({ error: 'Failed to get all pages' }, 500);
  }
});

// GET /api/content/pages/:slug - Get single page by slug
contentRoutes.get('/api/content/pages/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const page = await db.select().from(pageContent).where(eq(pageContent.slug, slug)).limit(1);

    if (page.length === 0) {
      return c.json({ error: 'Page not found' }, 404);
    }

    return c.json(page[0]);
  } catch (error) {
    console.error('Failed to get page:', error);
    return c.json({ error: 'Failed to get page' }, 500);
  }
});

// GET /api/content/blog - List published blog posts (no content body)
contentRoutes.get('/api/content/blog', async (c) => {
  try {
    const posts = await db.select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      excerpt: blogPosts.excerpt,
      author: blogPosts.author,
      tags: blogPosts.tags,
      readTime: blogPosts.readTime,
      publishedAt: blogPosts.publishedAt,
    }).from(blogPosts)
      .where(eq(blogPosts.published, true))
      .orderBy(desc(blogPosts.publishedAt));

    return c.json(posts);
  } catch (error) {
    console.error('Failed to get blog posts:', error);
    return c.json({ error: 'Failed to get blog posts' }, 500);
  }
});

// GET /api/content/blog/all - Get ALL blog posts with full content (for build script)
contentRoutes.get('/api/content/blog/all', async (c) => {
  try {
    const posts = await db.select().from(blogPosts).orderBy(desc(blogPosts.publishedAt));
    return c.json({ posts });
  } catch (error) {
    console.error('Failed to get all blog posts:', error);
    return c.json({ error: 'Failed to get all blog posts' }, 500);
  }
});

// GET /api/content/blog/:slug - Get single blog post by slug
contentRoutes.get('/api/content/blog/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const post = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);

    if (post.length === 0) {
      return c.json({ error: 'Blog post not found' }, 404);
    }

    return c.json(post[0]);
  } catch (error) {
    console.error('Failed to get blog post:', error);
    return c.json({ error: 'Failed to get blog post' }, 500);
  }
});

// ═══════════════════════════════════════════════════════════
// ADMIN ENDPOINTS (behind adminAuth)
// ═══════════════════════════════════════════════════════════

// GET /api/admin/content/pages - List all pages (same as public but for admin context)
contentRoutes.get('/api/admin/content/pages', async (c) => {
  try {
    const pages = await db.select({
      slug: pageContent.slug,
      title: pageContent.title,
      seoTitle: pageContent.seoTitle,
      seoDescription: pageContent.seoDescription,
      updatedAt: pageContent.updatedAt,
      publishedAt: pageContent.publishedAt,
    }).from(pageContent).orderBy(pageContent.slug);

    return c.json(pages);
  } catch (error) {
    console.error('Failed to get pages:', error);
    return c.json({ error: 'Failed to get pages' }, 500);
  }
});

// PUT /api/admin/content/pages/:slug - Update page content
contentRoutes.put('/api/admin/content/pages/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const body = await c.req.json();
    const { title, content, seoTitle, seoDescription } = body;

    if (!content) {
      return c.json({ error: 'Content is required' }, 400);
    }

    const now = new Date();
    
    // Upsert (insert if not exists, update if exists)
    const result = await db.insert(pageContent)
      .values({
        slug,
        title: title || slug,
        content,
        seoTitle,
        seoDescription,
        updatedAt: now,
        updatedBy: 'admin',
      })
      .onConflictDoUpdate({
        target: pageContent.slug,
        set: {
          title: title || slug,
          content,
          seoTitle,
          seoDescription,
          updatedAt: now,
          updatedBy: 'admin',
        },
      })
      .returning();

    return c.json(result[0]);
  } catch (error) {
    console.error('Failed to update page:', error);
    return c.json({ error: 'Failed to update page' }, 500);
  }
});

// POST /api/admin/content/pages - Create new page
contentRoutes.post('/api/admin/content/pages', async (c) => {
  try {
    const body = await c.req.json();
    const { slug, title, content, seoTitle, seoDescription } = body;

    if (!slug || !content) {
      return c.json({ error: 'Slug and content are required' }, 400);
    }

    // Check if slug already exists
    const existing = await db.select().from(pageContent).where(eq(pageContent.slug, slug)).limit(1);
    if (existing.length > 0) {
      return c.json({ error: 'Page with this slug already exists' }, 409);
    }

    const result = await db.insert(pageContent)
      .values({
        slug,
        title: title || slug,
        content,
        seoTitle,
        seoDescription,
        updatedAt: new Date(),
        updatedBy: 'admin',
      })
      .returning();

    return c.json(result[0]);
  } catch (error) {
    console.error('Failed to create page:', error);
    return c.json({ error: 'Failed to create page' }, 500);
  }
});

// DELETE /api/admin/content/pages/:slug - Delete page by slug
contentRoutes.delete('/api/admin/content/pages/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');

    const result = await db.delete(pageContent).where(eq(pageContent.slug, slug)).returning();

    if (result.length === 0) {
      return c.json({ error: 'Page not found' }, 404);
    }

    return c.json({ message: 'Page deleted successfully' });
  } catch (error) {
    console.error('Failed to delete page:', error);
    return c.json({ error: 'Failed to delete page' }, 500);
  }
});

// GET /api/admin/blog - List ALL blog posts (including unpublished drafts)
contentRoutes.get('/api/admin/blog', async (c) => {
  try {
    const posts = await db.select().from(blogPosts).orderBy(desc(blogPosts.updatedAt));
    return c.json(posts);
  } catch (error) {
    console.error('Failed to get blog posts:', error);
    return c.json({ error: 'Failed to get blog posts' }, 500);
  }
});

// POST /api/admin/blog - Create blog post
contentRoutes.post('/api/admin/blog', async (c) => {
  try {
    const body = await c.req.json();
    const { slug, title, excerpt, content, author, tags, readTime, published } = body;

    if (!slug || !title || !excerpt || !content || !author) {
      return c.json({ error: 'Slug, title, excerpt, content, and author are required' }, 400);
    }

    // Check if slug already exists
    const existing = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
    if (existing.length > 0) {
      return c.json({ error: 'Blog post with this slug already exists' }, 409);
    }

    const now = new Date();
    const result = await db.insert(blogPosts)
      .values({
        slug,
        title,
        excerpt,
        content,
        author,
        tags: tags || [],
        readTime,
        published: published || false,
        publishedAt: published ? now : null,
        createdAt: now,
        updatedAt: now,
        updatedBy: 'admin',
      })
      .returning();

    return c.json(result[0]);
  } catch (error) {
    console.error('Failed to create blog post:', error);
    return c.json({ error: 'Failed to create blog post' }, 500);
  }
});

// PUT /api/admin/blog/:id - Update blog post by UUID
contentRoutes.put('/api/admin/blog/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { slug, title, excerpt, content, author, tags, readTime, published } = body;

    // Get current post to check if published status is changing
    const currentPost = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
    if (currentPost.length === 0) {
      return c.json({ error: 'Blog post not found' }, 404);
    }

    const now = new Date();
    const wasUnpublished = !currentPost[0].published;
    const isNowPublished = published === true;
    
    // Set publishedAt if changing from unpublished to published
    const publishedAt = wasUnpublished && isNowPublished ? now : currentPost[0].publishedAt;

    const updateData: any = {
      updatedAt: now,
      updatedBy: 'admin',
    };

    // Only update fields that are provided
    if (slug !== undefined) updateData.slug = slug;
    if (title !== undefined) updateData.title = title;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (content !== undefined) updateData.content = content;
    if (author !== undefined) updateData.author = author;
    if (tags !== undefined) updateData.tags = tags;
    if (readTime !== undefined) updateData.readTime = readTime;
    if (published !== undefined) {
      updateData.published = published;
      updateData.publishedAt = publishedAt;
    }

    const result = await db.update(blogPosts)
      .set(updateData)
      .where(eq(blogPosts.id, id))
      .returning();

    return c.json(result[0]);
  } catch (error) {
    console.error('Failed to update blog post:', error);
    return c.json({ error: 'Failed to update blog post' }, 500);
  }
});

// DELETE /api/admin/blog/:id - Delete blog post
contentRoutes.delete('/api/admin/blog/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const result = await db.delete(blogPosts).where(eq(blogPosts.id, id)).returning();

    if (result.length === 0) {
      return c.json({ error: 'Blog post not found' }, 404);
    }

    return c.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Failed to delete blog post:', error);
    return c.json({ error: 'Failed to delete blog post' }, 500);
  }
});

// POST /api/admin/content/publish - Trigger rebuild
contentRoutes.post('/api/admin/content/publish', async (c) => {
  try {
    const now = new Date();
    
    // Update published_at on all page_content rows
    await db.update(pageContent)
      .set({ publishedAt: now })
      .execute();

    // Execute rebuild script
    const result = await new Promise<{ success: boolean; output?: string; error?: string }>((resolve) => {
      exec('/var/www/zkira-web/scripts/rebuild.sh', { timeout: 120000 }, (error, stdout, stderr) => {
        if (error) {
          resolve({ success: false, error: stderr || error.message });
        } else {
          resolve({ success: true, output: stdout });
        }
      });
    });

    return c.json(result);
  } catch (error) {
    console.error('Failed to trigger rebuild:', error);
    return c.json({ error: 'Failed to trigger rebuild' }, 500);
  }
});

export default contentRoutes;