import { BlockchainInnMsgInterface } from '../interfaces/blockchain-inn-msg.interface';
import { TransactionStatus } from './transaction-status.enum';

export type ContractInnMessageMethodsType = {
    sendInnMsg: (args: BlockchainInnMsgInterface) => TransactionStatus;
};
