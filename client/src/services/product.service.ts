import { request } from "../utils/request";

export const productService = {
  getProduct: async () => {
    return (await request(
      `/products`,
    )).data
  }
};
