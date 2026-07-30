import staffApiClient from '@/lib/staff-api-client';
import {
  ProductModule,
  CreateProductModuleRequest,
  UpdateProductModuleRequest,
  PaginatedProductModulesResponse,
} from '@/types';

function normalizeListPayload(body: unknown): PaginatedProductModulesResponse {
  if (Array.isArray(body)) {
    return {
      links: { next: null, previous: null },
      count: body.length,
      total_pages: 1,
      data: body as ProductModule[],
    };
  }
  const p = body as PaginatedProductModulesResponse;
  if (p?.data && Array.isArray(p.data)) {
    return p;
  }
  return {
    links: { next: null, previous: null },
    count: 0,
    total_pages: 1,
    data: [],
  };
}

class ProductModuleService {
  async listProductModules(params?: { page?: number }): Promise<PaginatedProductModulesResponse> {
    const response = await staffApiClient.get<unknown>('/product-modules/', { params });
    return normalizeListPayload(response.data);
  }

  async getProductModule(id: number): Promise<ProductModule> {
    const response = await staffApiClient.get<ProductModule>(`/product-modules/${id}/`);
    return response.data;
  }

  async createProductModule(data: CreateProductModuleRequest): Promise<ProductModule> {
    const response = await staffApiClient.post<ProductModule>('/product-modules/', data);
    return response.data;
  }

  async updateProductModule(id: number, data: UpdateProductModuleRequest): Promise<ProductModule> {
    const response = await staffApiClient.patch<ProductModule>(`/product-modules/${id}/`, data);
    return response.data;
  }

  async deleteProductModule(id: number): Promise<void> {
    await staffApiClient.delete(`/product-modules/${id}/`);
  }
}

export const productModuleService = new ProductModuleService();
export default productModuleService;
