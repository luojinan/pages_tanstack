import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Settings } from "lucide-react";
import { useState } from "react";
import { getListData } from "./api.list";
import BlackList from "./components/BlackList";

export const Route = createFileRoute("/douban/list")({
  component: RouteComponent,
  loader: async () => fetchList(),
});

const fetchList = createServerFn({ method: "GET" }).handler(async () => {
  try {
    console.info("Fetching douban posts list...");
    const data = await getListData();
    return data as ExternalPostsResponse;
  } catch (error) {
    console.error("Failed to fetch list:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch posts list");
  }
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
  const data = Route.useLoaderData();
  const [blacklist, setBlacklist] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleRefreshList = (newBlacklist) => {
    console.log("Updating blacklist:", newBlacklist);
    setBlacklist(newBlacklist);
  };

  const shouldFilterItem = (item) => {
    if (!blacklist || blacklist.length === 0) return false;
    return blacklist.some((entry) =>{
      return item.links[0]?.text.toLowerCase().includes(entry.name.toLowerCase());
    });
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-3 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Douban Posts List
          </h1>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="btn btn-primary btn-sm"
            aria-label="Open blacklist settings"
          >
            <Settings size={18} />
            设置过滤
          </button>
        </div>
        <div className="mb-4 p-3 bg-white border border-gray-200 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              <strong className="text-gray-900">Source:</strong> {data?.sourceUrl}
            </p>
            <p className="text-sm text-gray-600">
              <strong className="text-gray-900">Fetched:</strong>{" "}
              {data?.fetchedAt}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              <strong className="text-gray-900">Total:</strong> {data?.postCount}
            </p>
            {blacklist.length > 0 && (
              <p className="text-sm text-cyan-600">
                <strong>Active Filters:</strong> {blacklist.length} keyword{blacklist.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
          {blacklist.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">Filtering keywords:</p>
              <div className="flex flex-wrap gap-1">
                {blacklist.map((entry, index) => (
                  <span
                    key={index}
                    className="inline-block px-2 py-1 bg-cyan-100 text-cyan-700 text-xs rounded"
                  >
                    {entry.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {data?.posts.map((post) => (
          <ul key={post.id} className="space-y-2">
            {post.items
              .filter((item) => !shouldFilterItem(item))
              .map((item) => {
                const match = item.links[0]?.href.match(
                  /\/douban\/detail\/(\d+)\.html/,
                );
                const id = match ? match[1] : "";

                return (
                  <li key={item.id} className="block">
                    <Link
                      to="/douban/detail/$id"
                      params={{ id }}
                      className="block p-2 bg-white border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex flex-wrap gap-2 mb-1">
                        {item.links.map((link) => (
                          <span key={link.href} className="text-sm text-gray-900">
                            {link.text}
                          </span>
                        ))}
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        {item.textContent}
                      </div>
                    </Link>
                  </li>
                );
              })}
          </ul>
        ))}
      </div>

      <BlackList onRefreshList={handleRefreshList} isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </div>
  );
}
