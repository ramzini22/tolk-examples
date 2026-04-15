import { StateInitType } from '../types/state-init.type';

export interface BlockchainInnMsgInterface {
    address: string;
    amount: number;
    bounce: boolean;
    stateInit?: StateInitType;
    body?: unknown;
}
