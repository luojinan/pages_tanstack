import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/douban/detail/$id")({
  component: RouteComponent,
});

interface ExternalArticle {
  id: number;
  attributes: Record<string, string>;
  html: string;
  textContent: string;
  childTags: string[];
}

interface ExternalArticlesResponse {
  sourceUrl: string;
  fetchedAt: string;
  articleCount: number;
  articles: ExternalArticle[];
}

function RouteComponent() {
  const { data, isLoading, error } = useQuery<ExternalArticlesResponse>({
    queryKey: ["external-articles"],
    queryFn: () =>
      fetch("/demo/api/external-articles").then((res) => res.json()),
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-black p-4 text-white">
        <div className="w-full max-w-4xl p-8 rounded-xl backdrop-blur-md bg-black/50 shadow-xl border-8 border-black/10">
          <div className="text-center text-xl">Loading articles...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-black p-4 text-white">
        <div className="w-full max-w-4xl p-8 rounded-xl backdrop-blur-md bg-black/50 shadow-xl border-8 border-black/10">
          <div className="text-center text-red-500">
            Error loading articles: {(error as Error).message}
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
          External Articles
        </h1>
        <div className="mb-6 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
          <p>
            <strong>Source URL:</strong> {data?.sourceUrl}
          </p>
          <p>
            <strong>Fetched At:</strong> {data?.fetchedAt}
          </p>
          <p>
            <strong>Article Count:</strong> {data?.articleCount}
          </p>
        </div>

        {data?.articles.map((article) => (
          <div
            key={article.id}
            className="mb-6 p-6 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 shadow-lg"
            dangerouslySetInnerHTML={{ __html: article.html }}
          />
        ))}
      </div>
    </div>
  );
}
