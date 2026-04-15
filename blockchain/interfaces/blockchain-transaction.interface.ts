import { ContractStatusEnum } from '../types/contract-status.enum';
import { BlockchainTransactionInMsgInterface } from './blockchain-transaction-in-msg.interface';
import { BlockchainTransactionOutMsgInterface } from './blockchain-transaction-out-msg.interface';

export interface BlockchainTransactionInterface {
    address: string;
    lt: number;
    now: number;
    outMessagesCount: number;
    oldStatus: ContractStatusEnum;
    endStatus: ContractStatusEnum;
    totalFees: number;
    inMsg: BlockchainTransactionInMsgInterface | BlockchainTransactionOutMsgInterface;
    outMsg: BlockchainTransactionOutMsgInterface[];
}
