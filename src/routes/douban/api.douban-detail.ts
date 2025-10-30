import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";

const FORWARDED_HEADERS: Record<string, string> = {
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "accept-language":
    "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6,zh-TW;q=0.5",
  "cache-control": "no-cache",
  pragma: "no-cache",
  "sec-ch-ua":
    '"Microsoft Edge";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "same-origin",
  "sec-fetch-user": "?1",
  "upgrade-insecure-requests": "1",
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:141.0) Gecko/20100101 Firefox/141.0",
};

export async function getDetailData(id: string) {
  const sourceUrl = `https://new.xianbao.fun/douban-maizu/${id}.html`;
  const response = await fetch(sourceUrl, {
    method: "GET",
    headers: FORWARDED_HEADERS,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch source. Status: ${response.status} ${response.statusText}`,
    );
  }

  const html = await response.text();

  const cheerio = await import("cheerio");
  const $ = cheerio.load(html);
  const first = $("article").get(0);
  if (!first) {
    return {} as const;
  }

  const $article = $(first);
  $article.find("script,style").remove();

  let doubanID = "";
  const $copyrightDiv = $article.find(".art-copyright");
  if ($copyrightDiv.length > 0) {
    const href = $copyrightDiv.find("a").attr("href") || "";
    const match = href.match(/topic\/(\d+)/);
    if (match?.[1]) {
      doubanID = match?.[1];
    }
  }

  $article.find("#article-button").remove();
  $article.find(".art-copyright").remove();

  return {
    id: 0,
    doubanID,
    html: $article.html()?.trim() || "",
    textContent: $article.text().trim(),
  };
}

export const Route = createFileRoute("/douban/api/douban-detail")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const id = body?.data;
          const payload = await getDetailData(id);
          return json(payload);
        } catch (error) {
          console.error(error);
          if (error instanceof Error) {
            const message = error.message;
            return json(
              { error: message },
              { status: 500 },
            );
          }
          return json({ error: "Unexpected server error" }, { status: 500 });
        }
      },
    },
  },
});
