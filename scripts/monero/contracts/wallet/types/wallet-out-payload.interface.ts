import { StateInitType } from '../../../../../blockchain/types/state-init.type';

export interface WalletOutPayloadInterface<T = object> {
    to: string;
    password: string;
    amount: number;
    bounce?: boolean;
    stateInit?: StateInitType;
    body?: T;
}
