export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    governorate: string;
    status: 'active' | 'inactive';
    verified: boolean;
    walletBalance: number;
    points: number;
    joinedDate: string;
    avatar?: string;
}

export interface Business {
    id: string;
    name: string;
    ownerEmail: string;
    type: string;
    appType: 'Pass' | 'Care' | 'Go';
    city: string;
    rating: number;
    status: 'active' | 'inactive' | 'pending';
    createdDate: string;
    logo?: string;
}

export interface Driver {
    id: string;
    name: string;
    email: string;
    phone: string;
    vehicleType: string;
    status: 'active' | 'inactive';
    availability: 'available' | 'busy' | 'offline';
    rating: number;
    totalDeliveries: number;
    earnings: number;
    avatar?: string;
}

export interface Transaction {
    id: string;
    date: string;
    type: 'payment' | 'refund' | 'payout' | 'wallet-topup';
    user: string;
    amount: number;
    paymentMethod: 'cash' | 'card' | 'wallet' | 'chamcash' | 'ecash' | 'bank_transfer';
    status: 'completed' | 'pending' | 'failed' | 'refunded';
    reference: string;
}
