import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ReadLaterItemData } from "./types";
import { supabase } from "../../lib/supabase";

// Schema for validation
const AddItemSchema = z.object({
	url: z.string().url("必须是有效的URL"),
	title: z.string().min(1, "标题不能为空"),
	description: z.string().optional(),
});

const DeleteItemSchema = z.object({
	id: z.string().min(1, "ID不能为空"),
});

const UpdateItemSchema = z.object({
	id: z.string().min(1, "ID不能为空"),
	url: z.string().url("必须是有效的URL").optional(),
	title: z.string().min(1, "标题不能为空").optional(),
	description: z.string().optional(),
});

// Get all read-later items
export const getReadLaterList = createServerFn({ method: "GET" }).handler(
	async () => {
		const { data, error } = await supabase
			.from("read_later")
			.select("*")
			.order("created_at", { ascending: false });

		if (error) {
			throw new Error(`获取列表失败: ${error.message}`);
		}

		return data as ReadLaterItemData[];
	},
);

// Add a new read-later item
export const addReadLaterItem = createServerFn({ method: "POST" })
	.inputValidator(AddItemSchema)
	.handler(async ({ data }) => {
		const { data: newItem, error } = await supabase
			.from("read_later")
			.insert({
				url: data.url,
				title: data.title,
				description: data.description,
			})
			.select()
			.single();

		if (error) {
			throw new Error(`添加失败: ${error.message}`);
		}

		return newItem as ReadLaterItemData;
	});

// Delete a read-later item
export const deleteReadLaterItem = createServerFn({ method: "POST" })
	.inputValidator(DeleteItemSchema)
	.handler(async ({ data }) => {
		const { error } = await supabase
			.from("read_later")
			.delete()
			.eq("id", data.id);

		if (error) {
			throw new Error(`删除失败: ${error.message}`);
		}

		return { success: true, id: data.id };
	});

// Update a read-later item
export const updateReadLaterItem = createServerFn({ method: "POST" })
	.inputValidator(UpdateItemSchema)
	.handler(async ({ data }) => {
		const updateData: Partial<{
			url: string;
			title: string;
			description: string;
		}> = {};

		if (data.url) updateData.url = data.url;
		if (data.title) updateData.title = data.title;
		if (data.description !== undefined) updateData.description = data.description;

		const { data: updatedItem, error } = await supabase
			.from("read_later")
			.update(updateData)
			.eq("id", data.id)
			.select()
			.single();

		if (error) {
			throw new Error(`更新失败: ${error.message}`);
		}

		return updatedItem as ReadLaterItemData;
	});
