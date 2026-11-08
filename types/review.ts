export type Review = {
  id: number;
  menu_id: number;
  menu_name: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
};
