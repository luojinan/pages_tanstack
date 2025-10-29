import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/douban/list")({
  component: RouteComponent,
  loader: () => {
    return fetch("/douban/api/list").then((res) => res.json());
  },
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
            <strong className="text-gray-900">Fetched:</strong> {data?.fetchedAt}
          </p>
          <p className="text-sm text-gray-600">
            <strong className="text-gray-900">Count:</strong> {data?.postCount}
          </p>
        </div>

        {data?.posts.map((post) => (
          <div
            key={post.id}
            className="mb-3 p-3 sm:p-4 bg-white border border-gray-200"
          >
            <h3 className="text-base font-semibold mb-2 text-gray-900">Post {post.id + 1}</h3>
            <ul className="space-y-2">
              {post.items.map((item) => (
                <li
                  key={item.id}
                  className="p-2 border border-gray-100"
                >
                  {item.images.length > 0 && (
                    <div className="mb-2">
                      {item.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img.src}
                          alt={img.alt}
                          className="max-w-full h-auto"
                        />
                      ))}
                    </div>
                  )}
                  <div className="mb-2 text-sm text-gray-800">{item.textContent}</div>
                  {item.links.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {item.links.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-900 underline hover:no-underline"
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
