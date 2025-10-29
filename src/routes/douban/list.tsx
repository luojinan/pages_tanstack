import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getListData } from "./api.list";

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
  console.log(data);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-3 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 text-center text-gray-900">
          Douban Posts List
        </h1>
        <div className="mb-4 p-3 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">
            <strong className="text-gray-900">Source:</strong> {data?.sourceUrl}
          </p>
          <p className="text-sm text-gray-600">
            <strong className="text-gray-900">Fetched:</strong>{" "}
            {data?.fetchedAt}
          </p>
          <p className="text-sm text-gray-600">
            <strong className="text-gray-900">Count:</strong> {data?.postCount}
          </p>
        </div>

        {data?.posts.map((post) => (
          <ul key={post.id} className="space-y-2">
            {post.items.map((item) => {
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
    </div>
  );
}
