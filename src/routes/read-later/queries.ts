import { queryOptions } from "@tanstack/react-query";
import { getReadLaterList } from "./api";

// 定义查询选项，可以在 loader 和组件中复用
export const readLaterListQueryOptions = queryOptions({
	queryKey: ["readLaterList"],
	queryFn: () => getReadLaterList(),
});
