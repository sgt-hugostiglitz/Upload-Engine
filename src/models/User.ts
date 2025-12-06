import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  telegramId: string;
  tokens: any;
}

const UserSchema = new Schema<IUser>({
  telegramId: { type: String, required: true, unique: true },
  tokens: { type: Object, required: true }
});

export const User = mongoose.model<IUser>("User", UserSchema);
