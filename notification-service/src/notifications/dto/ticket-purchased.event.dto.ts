import { IsString, IsEmail, IsNotEmpty, IsISO8601, IsOptional } from 'class-validator';

export class TicketPurchasedEventDto {
    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsEmail()
    @IsNotEmpty()
    userEmail: string;

    @IsString()
    @IsNotEmpty()
    ticketId: string;

    @IsString()
    @IsNotEmpty()
    ticketType: string;

    @IsISO8601()
    purchaseDate: string;

    @IsString()
    @IsNotEmpty()
    qrCodeData: string;

    @IsString()
    @IsOptional()
    qrCodeImage?: string; // Base64 encoded QR code image
}