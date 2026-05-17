import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import BlogReveal from '../../components/motion/BlogReveal';
import MomentList from './MomentList';
import { getContentCollectionDir, getRuntimeSiteConfig } from '../../lib/contentSource';

export const dynamic = 'force-dynamic';

type Moment = {
  id: string;
  date: string;
  location: string;
  images: string[];
  content: string;
};

export const metadata = {
  title: "Moments | R0L1 Studio",
  description: "Short timeline updates and build moments",
};

export default function MomentsPage() {
  const runtimeConfig = getRuntimeSiteConfig();
  const momentsDirectory = getContentCollectionDir('moments');
  let allMoments: Moment[] = [];

  try {
    if (fs.existsSync(momentsDirectory)) {
      const fileNames = fs.readdirSync(momentsDirectory).filter(fileName => fileName.endsWith('.md'));
      allMoments = fileNames.map(fileName => {
        const fullPath = path.join(momentsDirectory, fileName);
        const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'));

        return {
          id: data.id || fileName.replace(/\.md$/, ''),
          date: data.date || '1970-01-01',
          location: data.location || '',
          images: data.images || [],
          content: content.trim(),
        };
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  } catch (error) {
    console.error("Failed to read moments:", error);
  }

  return (
    <div className="min-h-screen relative pb-10 flex flex-col">
      <Navbar />
      <PageTransition className="flex-1 flex flex-col">
        <BlogReveal preset="list" className="flex-1 flex flex-col">
          <div data-blog-reveal className="flex-1 flex flex-col">
            <MomentList
              moments={allMoments}
              authorName={runtimeConfig.authorName}
              avatarUrl={runtimeConfig.avatarUrl}
            />
          </div>
        </BlogReveal>
      </PageTransition>
    </div>
  );
}
