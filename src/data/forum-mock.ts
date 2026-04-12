

export type ForumChipId = "all" | "articles" | "rooms" | "chatbot";

export type ForumArticle = {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  publishedAt: string;
  readTime: string;
  commentCount: number;
  likeCount: number;
};

export type ForumRoom = {
  id: string;
  name: string;
  topic: string;
  membersApprox: number;
  isLive?: boolean;
};

export type ForumComment = {
  id: string;
  author: string;
  body: string;
  likes: number;
  replies?: ForumComment[];
};

export const FORUM_ARTICLES: ForumArticle[] = [
  {
    id: "a1",
    title: "Grounding when your mind won’t slow down",
    excerpt:
      "Five gentle steps you can use before sleep or after a stressful message — no special equipment.",
    author: "PeacePlot Editorial",
    publishedAt: "2d ago",
    readTime: "6 min",
    commentCount: 14,
    likeCount: 128,
  },
  {
    id: "a2",
    title: "How to name stress without judging yourself",
    excerpt:
      "Labeling emotions can reduce their intensity; here is a compassionate framing that avoids toxic positivity.",
    author: "Dr. M. Okonkwo",
    publishedAt: "1w ago",
    readTime: "8 min",
    commentCount: 31,
    likeCount: 256,
  },
  {
    id: "a3",
    title: "Forum safety: what we moderate (and why)",
    excerpt:
      "A plain-language overview of community rules, crisis resources, and how to report concerns.",
    author: "Community team",
    publishedAt: "3d ago",
    readTime: "4 min",
    commentCount: 8,
    likeCount: 92,
  },
];

export const FORUM_ROOMS: ForumRoom[] = [
  {
    id: "r1",
    name: "Daily check-in",
    topic: "Share one word for how today feels — no advice unless asked.",
    membersApprox: 420,
  },
  {
    id: "r2",
    name: "Sleep & wind-down",
    topic: "Bedtime wins, sound mixes, and what didn’t work — calm tone only.",
    membersApprox: 310,
    isLive: true,
  },
  {
    id: "r3",
    name: "Ask a question",
    topic: "Peer support — not medical diagnosis; see guidelines for crisis links.",
    membersApprox: 890,
  },
];

export const FORUM_ARTICLE_COMMENTS: Record<string, ForumComment[]> = {
  a1: [
    {
      id: "c1",
      author: "river_mind",
      body: "This helped last night — especially step 3. Thank you.",
      likes: 24,
      replies: [
        {
          id: "c1a",
          author: "PeacePlot Editorial",
          body: "Glad it landed. Small repeats beat perfect sessions.",
          likes: 8,
        },
      ],
    },
    {
      id: "c2",
      author: "anon_owl",
      body: "Could you add a version for loud workplaces?",
      likes: 5,
      replies: [
        {
          id: "c2a",
          author: "PeacePlot Editorial",
          body: "On the list for the next edit — we’ll anchor it to short breaks.",
          likes: 3,
        },
        {
          id: "c2b",
          author: "river_mind",
          body: "+1 — headphones + step 1 is my go-to.",
          likes: 2,
        },
      ],
    },
  ],
  a2: [
    {
      id: "c3",
      author: "calm_seeker",
      body: "The ‘name it without fixing’ line changed how I journal.",
      likes: 41,
    },
  ],
  a3: [],
};

export function getForumArticle(id: string): ForumArticle | undefined {
  return FORUM_ARTICLES.find((a) => a.id === id);
}

export function getForumRoom(id: string): ForumRoom | undefined {
  return FORUM_ROOMS.find((r) => r.id === id);
}

export function getArticleComments(articleId: string): ForumComment[] {
  return FORUM_ARTICLE_COMMENTS[articleId] ?? [];
}
