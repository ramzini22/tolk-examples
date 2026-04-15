import { ContractInterface } from '../interfaces/contract.interface';
import { BlockchainUtils } from '../utils/blockchain.utils';
import { ContractStatusEnum } from '../types/contract-status.enum';
import { StateInitType } from '../types/state-init.type';

export class BaseContract<T extends object = object> implements ContractInterface {
    address: string;
    balance: number;
    code: string;
    storage: T;
    status: ContractStatusEnum;

    constructor(stateInit: StateInitType<T>) {
        this.address = BlockchainUtils.getAddress(stateInit);
        this.balance = 0;
        this.code = stateInit.code;
        this.storage = stateInit.data;
        this.status = ContractStatusEnum.UNINITIALIZED;
    }
}
