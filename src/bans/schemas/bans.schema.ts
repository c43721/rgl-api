import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BanSchema = Ban & Document;

@Schema()
export class Ban {
  @Prop()
  startingBan: string;
}

export const BanSchema = SchemaFactory.createForClass(Ban);