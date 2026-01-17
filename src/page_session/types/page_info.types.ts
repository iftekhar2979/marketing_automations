export interface PageInfo {
  id: string;
  name: string;
  access_token: string;
  category: string;
}

export interface PageDataMap {
  [key: string]: PageInfo;
}

export interface PageResponse {
  data: PageDataMap;
}
