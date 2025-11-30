import { createFileRoute, ErrorComponent } from "@tanstack/react-router";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { useState } from "react";
import {
	addReadLaterItem,
	deleteReadLaterItem,
	updateReadLaterItem,
} from "./api";
import AddItemForm from "./components/AddItemForm";
import ReadLaterItem from "./components/ReadLaterItem";
import EmptyState from "./components/EmptyState";
import { readLaterListQueryOptions } from "./queries";

export const Route = createFileRoute("/read-later/")({
	// Loader: 在路由加载时预加载数据（SSR 支持）
	loader: async ({ context }) => {
		// 使用 ensureQueryData 确保数据被缓存
		// 这会在服务端执行，数据会流式传输到客户端
		await context.queryClient.ensureQueryData(readLaterListQueryOptions);
	},
	// 使用内置的 ErrorComponent 处理错误
	errorComponent: ErrorComponent,
	component: ReadLaterList,
});

function ReadLaterList() {
	const queryClient = useQueryClient();
	const [editingId, setEditingId] = useState<string | null>(null);

	// 使用 useSuspenseQuery 从缓存中读取数据
	// 数据已经在 loader 中预加载，不会有 loading 状态
	const { data: items = [] } = useSuspenseQuery(readLaterListQueryOptions);

	// Add mutation
	const addMutation = useMutation({
		mutationFn: (data: { url: string; title: string; description?: string }) =>
			addReadLaterItem({ data }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["readLaterList"] });
		},
	});

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: (id: string) => deleteReadLaterItem({ data: { id } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["readLaterList"] });
		},
	});

	// Update mutation
	const updateMutation = useMutation({
		mutationFn: (data: {
			id: string;
			url?: string;
			title?: string;
			description?: string;
		}) => updateReadLaterItem({ data }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["readLaterList"] });
			setEditingId(null);
		},
	});

	const handleDelete = (id: string) => {
		if (confirm("确定要删除这个项目吗？")) {
			deleteMutation.mutate(id);
		}
	};

	return (
		<div className="min-h-screen p-8 bg-gradient-to-br from-purple-50 to-pink-50">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-4xl font-bold mb-8 text-gray-800">
					稍后阅读清单
				</h1>

				<AddItemForm addMutation={addMutation} />

				{/* List */}
				<div className="space-y-4">
					{items.length === 0 ? (
						<EmptyState />
					) : (
						items.map((item) => (
							<ReadLaterItem
								key={item.id}
								item={item}
								isEditing={editingId === item.id}
								onEdit={() => setEditingId(item.id)}
								onDelete={() => handleDelete(item.id)}
								onCancelEdit={() => setEditingId(null)}
								deleteMutation={deleteMutation}
								updateMutation={updateMutation}
							/>
						))
					)}
				</div>
			</div>
		</div>
	);
}
