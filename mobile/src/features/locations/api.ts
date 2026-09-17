import { apiGet } from "@/lib/api/client";

export type Province = { code: string; name: string };

export const getProvinces = () => apiGet<Province[]>("/locations/provinces");

export const getDistricts = (provinceCode: string) =>
  apiGet<string[]>(`/locations/provinces/${provinceCode}/districts`);

export const getNeighborhoods = (provinceCode: string, district: string) =>
  apiGet<string[]>(
    `/locations/provinces/${provinceCode}/districts/${encodeURIComponent(district)}/neighborhoods`,
  );
