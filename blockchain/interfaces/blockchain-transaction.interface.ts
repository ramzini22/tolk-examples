import { ContractStatusEnum } from '../types/contract-status.enum';
import { BlockchainTransactionInMsgInterface } from './blockchain-transaction-in-msg.interface';
import { BlockchainTransactionOutMsgInterface } from './blockchain-transaction-out-msg.interface';

export interface BlockchainTransactionInterface<
    T = BlockchainTransactionInMsgInterface | BlockchainTransactionOutMsgInterface,
> {
    address: string;
    lt: number;
    now: number;
    outMessagesCount: number;
    oldStatus: ContractStatusEnum;
    endStatus: ContractStatusEnum;
    totalFees: number;
    inMsg: T;
    outMsg: BlockchainTransactionOutMsgInterface[];
}
