export type AppBrand = "Finora";

export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
};
