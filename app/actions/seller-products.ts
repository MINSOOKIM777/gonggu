"use server";

import {
  createProduct as _createProduct,
  updateProduct as _updateProduct,
  deleteProduct as _deleteProduct,
} from "./supplier-products";
import type { ProductActionResult } from "./supplier-products";

export type { ProductActionResult };

export async function createProduct(formData: FormData): Promise<ProductActionResult> {
  return _createProduct(formData);
}

export async function updateProduct(id: string, formData: FormData): Promise<ProductActionResult> {
  return _updateProduct(id, formData);
}

export async function deleteProduct(id: string): Promise<void> {
  return _deleteProduct(id);
}
