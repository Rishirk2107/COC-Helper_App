import mongoose, { Schema, Document } from 'mongoose';

export interface IWarMemberDoc extends Document {
  playerTag: string;
  playerName: string;
  warId: string;
  clanTag: string;
  townhallLevel: number;
  mapPosition: number;
  stars: number;
  destructionPercentage: number;
  attackCount: number;
  attacks: Array<{
    defenderTag: string;
    stars: number;
    destructionPercentage: number;
    order: number;
    duration: number;
  }>;
  warDate: string;
}

const WarMemberSchema = new Schema<IWarMemberDoc>(
  {
    playerTag: { type: String, required: true },
    playerName: String,
    warId: { type: String, required: true },
    clanTag: String,
    townhallLevel: Number,
    mapPosition: Number,
    stars: { type: Number, default: 0 },
    destructionPercentage: { type: Number, default: 0 },
    attackCount: { type: Number, default: 0 },
    attacks: [
      {
        defenderTag: String,
        stars: Number,
        destructionPercentage: Number,
        order: Number,
        duration: Number,
      },
    ],
    warDate: String,
  },
  { timestamps: true }
);

export default mongoose.models.WarMember || mongoose.model<IWarMemberDoc>('WarMember', WarMemberSchema);
