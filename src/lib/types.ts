// Shared domain types for PantryPal.

export type Macros = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export type FoodCategory =
  | "produce"
  | "dairy"
  | "meat"
  | "seafood"
  | "bakery"
  | "pantry"
  | "frozen"
  | "beverage"
  | "condiment"
  | "other";

export type PantryItem = {
  id: string;
  user_id: string;
  name: string;
  icon_key: string | null;
  quantity: number | null;
  unit: string | null;
  category: FoodCategory | null;
  fdc_id: number | null;
  macros_per_100g: Macros | null;
  source: "receipt" | "photo" | "manual";
  added_at: string;
  expires_at: string | null;
};

export type MacroGoals = {
  user_id: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  updated_at: string;
};

export type IntakeEntry = {
  id: string;
  user_id: string;
  logged_on: string;
  food_name: string;
  quantity: number | null;
  unit: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  source: "pantry" | "manual" | "recipe" | null;
  created_at: string;
};

export type RecipeStep = {
  text: string;
  minutes?: number; // optional timer for this step
};

export type Recipe = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  servings: number | null;
  steps: RecipeStep[];
  macros: Macros | null;
  source: "ai" | "user";
  image_url: string | null;
  created_at: string;
};

export type RecipeIngredient = {
  id: string;
  recipe_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  fdc_id: number | null;
};

// Shape returned by the vision step when reading a receipt/grocery photo.
export type RecognizedFood = {
  name: string;
  quantity: number | null;
  unit: string | null;
  category: FoodCategory;
};
