export interface Order {
  id: number;
  clientName: string;
  clientEmoji: string;
  recipeId: string;
  dishName: string;
  dishEmoji: string;
  timeLeft: number;
  mood: "happy" | "neutral" | "special";
  reward: number;
}
