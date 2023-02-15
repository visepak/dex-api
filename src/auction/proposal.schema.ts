import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type ProposalDocument = Proposal & Document;

export enum PROPOSAL_STATE {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  ACCEPTED = 'ACCEPTED',
}

@Schema({ timestamps: true })
export class Proposal {
  @Prop({ nullable: false, index: true })
  proposalId!: number;

  @Prop({ nullable: false, index: true })
  watchId!: string;

  @Prop({ nullable: false, enum: PROPOSAL_STATE, index: true })
  state!: PROPOSAL_STATE;

  @Prop({ nullable: false, index: true })
  price!: number;

  @Prop()
  shares?: number;

  @Prop()
  totalShares?: number;

  @Prop({ nullable: false, index: true })
  proposer!: string;

  @Prop({ nullable: false })
  blockNumber!: number;

  @Prop({ nullable: false })
  logIndex!: number;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const ProposalSchema = SchemaFactory.createForClass(Proposal);
export const ProposalModel = { name: Proposal.name, schema: ProposalSchema };
