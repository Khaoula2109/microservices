import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class UserRegisteredEventDto {
    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;
}