import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayer extends Document {
  tag: string;
  name: string;
  townHallLevel: number;
  expLevel: number;
  trophies: number;
  bestTrophies: number;
  warStars: number;
  attackWins: number;
  defenseWins: number;
  totalStars: number;
  totalDestruction: number;
  totalAttacks: number;
  threeStarRate: number;
  averageStars: number;
  lastUpdated: Date;
}

const PlayerSchema = new Schema<IPlayer>(
  {
    tag: { type: String, required: true, unique: true },
    name: String,
    townHallLevel: Number,
    expLevel: Number,
    trophies: Number,
    bestTrophies: Number,
    warStars: Number,
    attackWins: Number,
    defenseWins: Number,
    totalStars: { type: Number, default: 0 },
    totalDestruction: { type: Number, default: 0 },
    totalAttacks: { type: Number, default: 0 },
    threeStarRate: { type: Number, default: 0 },
    averageStars: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.Player || mongoose.model<IPlayer>('Player', PlayerSchema);
