import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import BlogReveal from '../../components/motion/BlogReveal';
import MomentList, { type DynamicItem, type DynamicItemFilter } from './MomentList';
import { getContentCollectionDir, getRuntimeSiteConfig } from '../../lib/contentSource';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "动态 | R0L1 Studio",
  description: "短动态、随笔和日常记录",
};

function normalizeType(rawType: string | undefined): DynamicItemFilter {
  if (rawType === 'moment' || rawType === 'essay') return rawType;
  return 'all';
}

export default async function MomentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const initialType = normalizeType(resolvedSearchParams.type);
  const runtimeConfig = getRuntimeSiteConfig();
  const momentsDirectory = getContentCollectionDir('moments');
  const chattersDirectory = getContentCollectionDir('chatters');
  let allItems: DynamicItem[] = [];

  try {
    if (fs.existsSync(momentsDirectory)) {
      const fileNames = fs.readdirSync(momentsDirectory).filter(fileName => fileName.endsWith('.md'));
      allItems = allItems.concat(fileNames.map(fileName => {
        const fullPath = path.join(momentsDirectory, fileName);
        const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'));

        return {
          type: 'moment' as const,
          id: data.id || fileName.replace(/\.md$/, ''),
          date: data.date || '1970-01-01',
          location: data.location || '',
          images: data.images || [],
          content: content.trim(),
        };
      }));
    }

    if (fs.existsSync(chattersDirectory)) {
      const fileNames = fs.readdirSync(chattersDirectory).filter(fileName => fileName.endsWith('.md'));
      allItems = allItems.concat(fileNames.map(fileName => {
        const slug = fileName.replace(/\.md$/, '');
        const fullPath = path.join(chattersDirectory, fileName);
        const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'));
        const plainContent = content.replace(/^#+ .*\n/m, '').trim();

        return {
          type: 'essay' as const,
          id: `essay-${slug}`,
          slug,
          title: data.title || '无标题随笔',
          date: data.date || '1970-01-01',
          tags: Array.isArray(data.tags) ? data.tags : data.tags ? [String(data.tags)] : [],
          mood: data.mood || '',
          cover: data.cover || '',
          content: plainContent,
          excerpt: data.description || plainContent.slice(0, 120),
        };
      }));
    }
  } catch (error) {
    console.error("Failed to read dynamic content:", error);
  }

  allItems = allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen relative pb-10 flex flex-col">
      <Navbar />
      <PageTransition className="flex-1 flex flex-col">
        <BlogReveal preset="list" className="flex-1 flex flex-col">
          <div data-blog-reveal className="flex-1 flex flex-col">
            <MomentList
              items={allItems}
              initialType={initialType}
              authorName={runtimeConfig.authorName}
              avatarUrl={runtimeConfig.avatarUrl}
            />
          </div>
        </BlogReveal>
      </PageTransition>
    </div>
  );
}
