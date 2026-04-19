import { ContractStatusEnum } from '../types/contract-status.enum';
import { TransactionStatus } from '../types/transaction-status.enum';
import { ContractOutMessageMethodsType } from '../types/contract-out-message-methods.type';
import { ContractInnMessageMethodsType } from '../types/contract-inn-message-methods.type';
import { BlockchainInnMsgInterface } from './blockchain-inn-msg.interface';

export interface ContractInterface {
    address: string;
    balance: number;
    code: string;
    storage: object;
    status: ContractStatusEnum;

    innMsg?: (data: BlockchainInnMsgInterface, methods: ContractInnMessageMethodsType) => TransactionStatus;
    outMsg?: (data: any, methods: ContractOutMessageMethodsType) => TransactionStatus;
    onBounce?: (data?: unknown) => void;
}
