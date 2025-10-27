import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";

const DEFAULT_SOURCE_URL = "https://new.xianbao.fun/category-douban-maizu/";

const ALLOWED_HOSTS = new Set(["new.xianbao.fun"]);

const FORWARDED_HEADERS: Record<string, string> = {
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "accept-language":
    "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6,zh-TW;q=0.5",
  "cache-control": "max-age=0",
  "sec-ch-ua":
    '"Microsoft Edge";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "none",
  "sec-fetch-user": "?1",
  "upgrade-insecure-requests": "1",
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:141.0) Gecko/20100101 Firefox/141.0",
};

async function getPostPayload(sourceUrl: string) {
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

  const { JSDOM } = await import("jsdom");
  const dom = new JSDOM(html);
  const window = dom.window;
  const document = window.document;

  // Find all ul elements with class "new-post"
  let newPostElements = Array.from(document.querySelectorAll("ul.new-post"));

  // If no ul.new-post elements found, also try looking for potential parent containers
  // that might contain new post lists
  if (newPostElements.length === 0) {
    // Alternative selectors that might contain new posts in Douban context
    const alternativeSelectors = [
      ".new-posts ul", // Elements with class new-posts containing ul
      '[class*="new-post"] ul', // Elements containing new-post in class name containing ul
      'ul[class*="new"]', // ul elements with classes containing "new"
    ];

    for (const selector of alternativeSelectors) {
      const elements = Array.from(document.querySelectorAll(selector));
      if (elements.length > 0) {
        // If alternative elements found, use the first set
        const firstSet = elements as HTMLElement[];
        const processedElements = firstSet.filter(
          (ul) => ul.tagName.toLowerCase() === "ul",
        );
        if (processedElements.length > 0) {
          newPostElements = processedElements;
          break; // Use the first alternative that has elements
        }
      }
    }
  }

  const posts = newPostElements.map((ul, index) => {
    // Create a clone to clean up content
    const ulClone = ul.cloneNode(true) as HTMLElement;

    // Remove script and style tags if any
    ulClone.querySelectorAll("script,style").forEach((node) => {
      node.remove();
    });

    // Parse li elements from the ul
    const liElements = Array.from(ulClone.querySelectorAll("li"));
    const items = liElements.map((li, liIndex) => {
      // Remove script and style tags from li if any
      li.querySelectorAll("script,style").forEach((node) => {
        node.remove();
      });

      // Extract all links from the li element
      const links = Array.from(li.querySelectorAll("a")).map((a) => ({
        href:
          a.getAttribute("href")?.replace("/douban-maizu", "/douban/detail") ||
          "",
        text: a.textContent?.trim() || "",
      }));

      // Extract all images from the li element
      const images = Array.from(li.querySelectorAll("img")).map((img) => ({
        src: img.getAttribute("src") || "",
        alt: img.getAttribute("alt") || "",
      }));

      // Extract text content without links
      const cloneLi = li.cloneNode(true) as HTMLElement;
      cloneLi.querySelectorAll("a").forEach((a) => a.remove());
      const textContent = cloneLi.textContent?.trim() || "";

      return {
        id: liIndex,
        attributes: Object.fromEntries(
          Array.from((li as HTMLElement).attributes, (attr) => [
            attr.name,
            attr.value,
          ]),
        ),
        textContent: textContent,
        links: links,
        images: images,
        innerHTML: li.innerHTML.trim(),
      };
    });

    return {
      id: index,
      attributes: Object.fromEntries(
        Array.from(ulClone.attributes, (attr) => [attr.name, attr.value]),
      ),
      items: items,
      textContent: ulClone.textContent?.trim() ?? "",
      childTags: Array.from(
        new Set(
          Array.from(ulClone.querySelectorAll("*"), (node) =>
            node.tagName.toLowerCase(),
          ),
        ),
      ),
      tagName: ulClone.tagName.toLowerCase(),
    };
  });

  // Clean up JSDOM window to prevent memory leaks
  window.close();

  return {
    sourceUrl,
    fetchedAt: new Date().toISOString(),
    postCount: posts.length,
    posts,
  };
}

function resolveSourceUrl(request: Request) {
  const requestUrl = new URL(request.url);
  const candidateUrl = requestUrl.searchParams.get("url") ?? DEFAULT_SOURCE_URL;

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(candidateUrl);
  } catch {
    throw new Error("Invalid url parameter. Expecting an absolute URL.");
  }

  if (!ALLOWED_HOSTS.has(parsedUrl.host)) {
    throw new Error("The requested host is not allowed.");
  }

  return parsedUrl.toString();
}

export const Route = createFileRoute("/douban/api/list")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const sourceUrl = resolveSourceUrl(request);
          const payload = await getPostPayload(sourceUrl);
          return json(payload);
        } catch (error) {
          console.error(error);
          if (error instanceof Error) {
            const message = error.message;
            const isClientError =
              message.includes("not allowed") ||
              message.includes("Invalid url");
            return json(
              { error: message },
              { status: isClientError ? 400 : 500 },
            );
          }
          return json({ error: "Unexpected server error" }, { status: 500 });
        }
      },
    },
  },
});
