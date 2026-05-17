import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import BlogReveal from '../../components/motion/BlogReveal';
import ChatterBoard from './ChatterBoard';

type ChatterSummary = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  mood: string;
  cover: string;
  content: string;
};

export const metadata = {
  title: "Build Notes | R0L1 Studio",
  description: "Short notes and idea fragments",
};

export default function ChatterPage() {
  const chattersDirectory = path.join(process.cwd(), 'chatters');
  let chatters: ChatterSummary[] = [];

  try {
    if (!fs.existsSync(chattersDirectory)) {
      fs.mkdirSync(chattersDirectory);
    }

    const fileNames = fs.readdirSync(chattersDirectory).filter(fileName => fileName.endsWith('.md'));

    chatters = fileNames.map(fileName => {
      const slug = fileName.replace(/\.md$/, '');
      const fileContents = fs.readFileSync(path.join(chattersDirectory, fileName), 'utf8');
      const { data, content } = matter(fileContents);

      return {
        slug,
        title: data.title || '',
        date: data.date || 'Unknown time',
        tags: Array.isArray(data.tags) ? data.tags : data.tags ? [String(data.tags)] : [],
        mood: data.mood || '',
        cover: data.cover || '',
        content: content.replace(/^#+ .*\n/m, ''),
      };
    }).sort((a, b) => (new Date(b.date).getTime() - new Date(a.date).getTime()));
  } catch (e) {
    console.error("Failed to read build note files:", e);
  }

  return (
    <div className="min-h-screen relative pb-10">
      <Navbar />
      <PageTransition>
        <BlogReveal preset="list">
          <div data-blog-reveal>
            <ChatterBoard chatters={chatters} />
          </div>
        </BlogReveal>
      </PageTransition>
    </div>
  );
}
