import mongoose, { Schema, Document } from 'mongoose';

export interface IWarMember {
  tag: string;
  name: string;
  townhallLevel: number;
  mapPosition: number;
  attacks: Array<{
    defenderTag: string;
    stars: number;
    destructionPercentage: number;
    order: number;
    duration: number;
  }>;
  defenseCount: number;
}

export interface IWar extends Document {
  state: string;
  teamSize: number;
  preparationStartTime: string;
  startTime: string;
  endTime: string;
  clan: {
    tag: string;
    name: string;
    stars: number;
    destructionPercentage: number;
    attacks: number;
    members: IWarMember[];
  };
  opponent: {
    tag: string;
    name: string;
    stars: number;
    destructionPercentage: number;
    attacks: number;
    members: IWarMember[];
  };
  result: string;
  fetchedAt: Date;
}

const AttackSchema = new Schema({
  defenderTag: String,
  stars: Number,
  destructionPercentage: Number,
  order: Number,
  duration: Number,
});

const WarMemberSchema = new Schema({
  tag: String,
  name: String,
  townhallLevel: Number,
  mapPosition: Number,
  attacks: [AttackSchema],
  defenseCount: Number,
});

const ClanWarSchema = new Schema({
  tag: String,
  name: String,
  stars: Number,
  destructionPercentage: Number,
  attacks: Number,
  members: [WarMemberSchema],
});

const WarSchema = new Schema<IWar>(
  {
    state: { type: String, required: true },
    teamSize: Number,
    preparationStartTime: String,
    startTime: String,
    endTime: String,
    clan: ClanWarSchema,
    opponent: ClanWarSchema,
    result: String,
    fetchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.War || mongoose.model<IWar>('War', WarSchema);
