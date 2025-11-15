import { IsString, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class BusDelayedEventDto {
  @IsString()
  routeName: string;

  @IsNumber()
  delay: number;

    @IsString()
    userId: string;

  @IsString()
  @IsOptional()
  userEmail?: string;

  @IsString()
  @IsOptional()
  userPhone?: string;
}
