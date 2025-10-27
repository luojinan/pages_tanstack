import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/douban/list")({
  component: RouteComponent,
});

interface ListItem {
  id: number;
  attributes: Record<string, string>;
  textContent: string;
  links: { href: string; text: string }[];
  images: { src: string; alt: string }[];
  innerHTML: string;
}

interface ExternalPost {
  id: number;
  attributes: Record<string, string>;
  items: ListItem[]; // Array of parsed li elements
  textContent: string;
  childTags: string[];
  tagName: string;
}

interface ExternalPostsResponse {
  sourceUrl: string;
  fetchedAt: string;
  postCount: number;
  posts: ExternalPost[];
}

function RouteComponent() {
  const { data, isLoading, error } = useQuery<ExternalPostsResponse>({
    queryKey: ["external-posts"],
    queryFn: () => fetch("/douban/api/list").then((res) => res.json()),
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-black p-4 text-white">
        <div className="w-full max-w-4xl p-8 rounded-xl backdrop-blur-md bg-black/50 shadow-xl border-8 border-black/10">
          <div className="text-center text-xl">Loading posts...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-black p-4 text-white">
        <div className="w-full max-w-4xl p-8 rounded-xl backdrop-blur-md bg-black/50 shadow-xl border-8 border-black/10">
          <div className="text-center text-red-500">
            Error loading posts: {(error as Error).message}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-black p-4 text-white"
      style={{
        backgroundImage:
          "radial-gradient(50% 50% at 80% 20%, #3B021F 0%, #7B1028 60%, #1A000A 100%)",
      }}
    >
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Douban Posts List
        </h1>
        <div className="mb-6 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
          <p>
            <strong>Source URL:</strong> {data?.sourceUrl}
          </p>
          <p>
            <strong>Fetched At:</strong> {data?.fetchedAt}
          </p>
          <p>
            <strong>Post Count:</strong> {data?.postCount}
          </p>
        </div>

        {data?.posts.map((post) => (
          <div
            key={post.id}
            className="mb-6 p-6 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 shadow-lg"
          >
            <h3 className="text-lg font-semibold mb-3">Post {post.id + 1}</h3>
            <ul className="space-y-2">
              {post.items.map((item) => (
                <li
                  key={item.id}
                  className="p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  {item.images.length > 0 && (
                    <div className="mb-2">
                      {item.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img.src}
                          alt={img.alt}
                          className="max-w-full h-auto rounded"
                        />
                      ))}
                    </div>
                  )}
                  <div className="mb-2">{item.textContent}</div>
                  {item.links.length > 0 && (
                    <div className="space-x-2">
                      {item.links.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-300 hover:text-blue-100 underline"
                        >
                          {link.text}
                        </a>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
