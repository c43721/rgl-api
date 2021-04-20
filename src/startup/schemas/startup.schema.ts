import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConfigurationSchema = Configuration & Document;

@Schema()
export class Configuration {
  @Prop()
  startingBan: string;
}

export const ConfigurationSchema = SchemaFactory.createForClass(Configuration);
