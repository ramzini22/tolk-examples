import { StateInitType } from '../types/state-init.type';

export interface BlockchainOutMsgInterface {
    address: string;
    stateInit?: StateInitType;
    body?: unknown;
}
