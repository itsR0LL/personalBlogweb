import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import BlogReveal from '../../components/motion/BlogReveal';
import ProjectsBoard from './ProjectsBoard';

export const metadata = {
  title: "Projects | R0L1 Studio",
  description: "Project notes and code repositories",
};

export default function ProjectsPage() {
  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <BlogReveal preset="list" className="mt-28">
          <div data-blog-reveal>
            <ProjectsBoard />
          </div>
        </BlogReveal>
      </PageTransition>
    </div>
  );
}
