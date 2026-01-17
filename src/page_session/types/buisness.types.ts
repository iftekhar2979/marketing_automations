export interface Category {
  id: string;
  name: string;
}

export interface FacebookPage {
  access_token: string;
  category: string;
  category_list: Category[];
  name: string;
  id: string;
  tasks: string[];
}
