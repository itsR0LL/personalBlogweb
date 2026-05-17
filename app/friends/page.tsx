import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import BlogReveal from '../../components/motion/BlogReveal';
import FriendsBoard from './FriendsBoard';
import { getRuntimeFriends } from '../../lib/contentSource';

export const metadata = {
  title: "Friends | R0L1 Studio",
  description: "Recommended links and friendly sites",
};

export const dynamic = 'force-dynamic';

export default function FriendsPage() {
  const friends = getRuntimeFriends();
  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <BlogReveal preset="list" className="mt-28">
          <div data-blog-reveal>
            <FriendsBoard friends={friends} />
          </div>
        </BlogReveal>
      </PageTransition>
    </div>
  );
}
