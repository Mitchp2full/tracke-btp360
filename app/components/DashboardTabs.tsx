'use client';

import { useState } from 'react';
import PostsView from './PostsView';
import BestTimesView from './BestTimesView';
import ChatView from './ChatView';

type Post = {
  id: string;
  linkedin_urn: string;
  text: string | null;
  published_at: string | null;
  media_url: string | null;
  media_type: string | null;
  impressions: number;
  members_reached: number;
  reactions: number;
  reposts: number;
  comments: number;
  profile_views: number;
  new_followers: number;
  saves: number;
  link_clicks: number;
};

const TABS = [
  { id: 'posts', label: '📝 Mes posts'        },
  { id: 'times', label: '⏰ Meilleures heures' },
  { id: 'ia',    label: '🤖 Analyse IA'        },
];

type TabId = 'posts' | 'times' | 'ia';

export default function DashboardTabs({ posts }: { posts: Post[] }) {
  const [tab, setTab] = useState<TabId>('posts');

  const base = 'px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer border-0';

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as TabId)}
            className={base}
            style={tab === t.id
              ? { background: '#3b82f6', color: '#fff' }
              : { background: '#1a1a1a', color: '#666' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'posts' && <PostsView posts={posts} />}
      {tab === 'times' && <BestTimesView posts={posts} />}
      {tab === 'ia'    && <ChatView posts={posts as Record<string, unknown>[]} />}
    </div>
  );
}
