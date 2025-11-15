export class SubscriptionSuccessEventDto {
    userId: string;
    subscriptionId: string;
    subscriptionType: string;
    startDate?: string;
    newEndDate?: string;
    endDate: string;
    status: string;
    userEmail?: string;
    planName?: string;
    amount?: number;
    currency?: string;
}