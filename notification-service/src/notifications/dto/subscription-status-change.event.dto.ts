import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class SubscriptionStatusChangeEventDto {
    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsEmail()
    @IsNotEmpty()
    userEmail: string;

    @IsString()
    @IsNotEmpty()
    planName: string;

    @IsString()
    @IsNotEmpty()
    status: string;

    @IsString()
    @IsOptional()
    lastPaymentError?: string;
}