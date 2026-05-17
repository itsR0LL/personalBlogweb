import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import BlogReveal from '../../components/motion/BlogReveal';
import FriendsBoard from './FriendsBoard';

export const metadata = {
  title: "Friends | R0L1 Studio",
  description: "Recommended links and friendly sites",
};

export default function FriendsPage() {
  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <BlogReveal preset="list" className="mt-28">
          <div data-blog-reveal>
            <FriendsBoard />
          </div>
        </BlogReveal>
      </PageTransition>
    </div>
  );
}
