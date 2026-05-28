import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import ProjectsBoard from './ProjectsBoard';
import { getRuntimeProjects } from '../../lib/contentSource';

export const metadata = {
  title: "项目",
  description: "公开项目、工程化重构与可展示的开发记录",
};

export const dynamic = 'force-dynamic';

export default function ProjectsPage() {
  const projects = getRuntimeProjects();
  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition className="mt-28">
        <ProjectsBoard projects={projects} />
      </PageTransition>
    </div>
  );
}
