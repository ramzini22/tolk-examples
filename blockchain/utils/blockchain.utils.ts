import { blockchain } from '../blockchain';
import { SendMoneyType } from '../interfaces/blockchain-utils.interface';
import { createHmac } from 'crypto';
import { StateInitType } from '../types/state-init.type';
import { BaseContract } from '../contracts/base-contract';

export class BlockchainUtils {
    public static createUninitializedContract(address: string, balance: number) {
        const oldContract = blockchain.contracts.get(address);
        if (oldContract) return oldContract;
        const contract = new BaseContract({ code: '', data: {} });
        contract.address = address;
        contract.balance = balance;

        blockchain.setContract(contract);

        return contract;
    }

    public static sendMoney(payload: SendMoneyType) {
        blockchain.sendOutMsg({ ...payload });
    }

    public static getAddress({ code, data }: StateInitType) {
        return createHmac('sha256', code).update(JSON.stringify(data)).digest('hex');
    }
}
