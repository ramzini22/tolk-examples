import { BlockchainInnMsgInterface } from '../interfaces/blockchain-inn-msg.interface';
import { TransactionStatus } from './transaction-status.enum';

export type ContractOutMessageMethodsType = {
    sendInnMsg: (args: BlockchainInnMsgInterface) => TransactionStatus;
    acceptMessage: () => void;
};
