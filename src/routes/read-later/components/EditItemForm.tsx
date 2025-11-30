import type { UseMutationResult } from "@tanstack/react-query";
import { useState } from "react";

interface EditItemFormProps {
	itemId: string;
	initialUrl: string;
	initialTitle: string;
	initialDescription?: string;
	updateMutation: UseMutationResult<
		unknown,
		Error,
		{ id: string; url?: string; title?: string; description?: string }
	>;
	onCancel: () => void;
}

export default function EditItemForm({
	itemId,
	initialUrl,
	initialTitle,
	initialDescription = "",
	updateMutation,
	onCancel,
}: EditItemFormProps) {
	const [url, setUrl] = useState(initialUrl);
	const [title, setTitle] = useState(initialTitle);
	const [description, setDescription] = useState(initialDescription);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		updateMutation.mutate(
			{ id: itemId, url, title, description: description || undefined },
			{
				onSuccess: () => {
					onCancel();
				},
			},
		);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<label
					htmlFor={`edit-title-${itemId}`}
					className="block text-sm font-medium text-gray-700 mb-2"
				>
					标题
				</label>
				<input
					id={`edit-title-${itemId}`}
					type="text"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
					required
				/>
			</div>
			<div>
				<label
					htmlFor={`edit-url-${itemId}`}
					className="block text-sm font-medium text-gray-700 mb-2"
				>
					链接
				</label>
				<input
					id={`edit-url-${itemId}`}
					type="url"
					value={url}
					onChange={(e) => setUrl(e.target.value)}
					className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
					required
				/>
			</div>
			<div>
				<label
					htmlFor={`edit-description-${itemId}`}
					className="block text-sm font-medium text-gray-700 mb-2"
				>
					简介（可选）
				</label>
				<textarea
					id={`edit-description-${itemId}`}
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
					placeholder="简要描述这篇文章..."
					rows={3}
				/>
			</div>
			<div className="flex gap-2">
				<button
					type="submit"
					disabled={updateMutation.isPending}
					className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
				>
					{updateMutation.isPending ? "保存中..." : "保存"}
				</button>
				<button
					type="button"
					onClick={onCancel}
					className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
				>
					取消
				</button>
			</div>
			{updateMutation.isError && (
				<p className="text-red-600 text-sm">
					更新失败: {(updateMutation.error as Error).message}
				</p>
			)}
		</form>
	);
}
