import type { UseMutationResult } from "@tanstack/react-query";
import { useState } from "react";

interface AddItemFormProps {
	addMutation: UseMutationResult<
		unknown,
		Error,
		{ url: string; title: string; description?: string }
	>;
}

export default function AddItemForm({ addMutation }: AddItemFormProps) {
	const [url, setUrl] = useState("");
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (url && title) {
			addMutation.mutate(
				{ url, title, description: description || undefined },
				{
					onSuccess: () => {
						setUrl("");
						setTitle("");
						setDescription("");
					},
				},
			);
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="mb-8 p-6 bg-white rounded-lg shadow-md"
		>
			<h2 className="text-2xl font-semibold mb-4 text-gray-700">添加新文章</h2>
			<div className="mb-4">
				<label
					htmlFor="title"
					className="block text-sm font-medium text-gray-700 mb-2"
				>
					标题
				</label>
				<input
					id="title"
					type="text"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
					placeholder="文章标题"
					required
				/>
			</div>
			<div className="mb-4">
				<label
					htmlFor="url"
					className="block text-sm font-medium text-gray-700 mb-2"
				>
					链接
				</label>
				<input
					id="url"
					type="url"
					value={url}
					onChange={(e) => setUrl(e.target.value)}
					className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
					placeholder="https://example.com/article"
					required
				/>
			</div>
			<div className="mb-4">
				<label
					htmlFor="description"
					className="block text-sm font-medium text-gray-700 mb-2"
				>
					简介（可选）
				</label>
				<textarea
					id="description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
					placeholder="简要描述这篇文章..."
					rows={3}
				/>
			</div>
			<button
				type="submit"
				disabled={addMutation.isPending}
				className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
			>
				{addMutation.isPending ? "添加中..." : "添加到清单"}
			</button>
			{addMutation.isError && (
				<p className="mt-2 text-red-600 text-sm">
					添加失败: {(addMutation.error as Error).message}
				</p>
			)}
		</form>
	);
}
