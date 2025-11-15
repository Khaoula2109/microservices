import { IsString, IsNotEmpty, IsInt, IsOptional } from 'class-validator';

export class TripCanceledEventDto {
    @IsString()
    @IsNotEmpty()
    tripId: string;

    @IsString()
    @IsNotEmpty()
    routeName: string;

    @IsString()
    @IsNotEmpty()
    stopName: string;

    @IsString()
    @IsNotEmpty()
    scheduledTime: string;

    @IsInt()
    dayOfWeek: number;

    @IsString()
    @IsOptional()
    reason?: string;
}