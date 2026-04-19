import { StateInitType } from '../types/state-init.type';

export interface BlockchainInnMsgInterface<T = unknown> {
    address: string;
    amount: number;
    bounce: boolean;
    stateInit?: StateInitType;
    body?: T;
}
