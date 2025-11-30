import type { UseMutationResult } from "@tanstack/react-query";
import type { ReadLaterItemData } from "../types";
import EditItemForm from "./EditItemForm";

interface ReadLaterItemProps {
	item: ReadLaterItemData;
	isEditing: boolean;
	onEdit: () => void;
	onDelete: () => void;
	onCancelEdit: () => void;
	deleteMutation: UseMutationResult<unknown, Error, string>;
	updateMutation: UseMutationResult<
		unknown,
		Error,
		{ id: string; url?: string; title?: string; description?: string }
	>;
}

export default function ReadLaterItem({
	item,
	isEditing,
	onEdit,
	onDelete,
	onCancelEdit,
	deleteMutation,
	updateMutation,
}: ReadLaterItemProps) {
	return (
		<div className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
			{isEditing ? (
				<EditItemForm
					itemId={item.id}
					initialUrl={item.url}
					initialTitle={item.title}
					initialDescription={item.description}
					updateMutation={updateMutation}
					onCancel={onCancelEdit}
				/>
			) : (
				<>
					<h3 className="text-xl font-semibold text-gray-800 mb-2">
						{item.title}
					</h3>
					<a
						href={item.url}
						target="_blank"
						rel="noopener noreferrer"
						className="text-purple-600 hover:text-purple-800 hover:underline break-all mb-2 block"
					>
						{item.url}
					</a>
					{item.description && (
						<p className="text-gray-700 mb-2 italic">{item.description}</p>
					)}
					<p className="text-sm text-gray-500 mb-4">
						添加于: {new Date(item.created_at).toLocaleString("zh-CN")}
					</p>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={onEdit}
							className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
						>
							编辑
						</button>
						<button
							type="button"
							onClick={onDelete}
							disabled={deleteMutation.isPending}
							className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition-colors"
						>
							{deleteMutation.isPending ? "删除中..." : "删除"}
						</button>
					</div>
				</>
			)}
		</div>
	);
}
