import { BlockchainInterface } from './interfaces/blockchain.interface';
import { ContractStatusEnum } from './types/contract-status.enum';
import { BlockchainUtils } from './utils/blockchain.utils';
import { TransactionStatus } from './types/transaction-status.enum';
import { storageCommission } from './constants/storage-commission';
import { BlockchainInnMsgInterface } from './interfaces/blockchain-inn-msg.interface';
import { BlockchainOutMsgInterface } from './interfaces/blockchain-out-msg.interface';
import { ContractInterface } from './interfaces/contract.interface';
import { messageCommission } from './constants/message-commission';
import { InnerMessagesListType } from './types/inner-messages-list.type';
import { BlockchainTransactionInterface } from './interfaces/blockchain-transaction.interface';
import { BlockchainTransactionInMsgEnum } from './types/blockchain-transaction-in-msg.enum';
import { BaseContract } from './contracts/base-contract';
import * as fs from 'node:fs';
import path from 'node:path';

class Blockchain implements BlockchainInterface {
    transactions: BlockchainTransactionInterface[];
    contracts: Map<string, ContractInterface>;
    innerMessagesList: InnerMessagesListType;

    constructor() {
        this.transactions = [];
        this.contracts = new Map<string, ContractInterface>();
        this.innerMessagesList = [];
    }

    public sendOutMsg(args: BlockchainOutMsgInterface): TransactionStatus {
        const newBlock = new Blockchain();
        const { address, stateInit } = args;
        let smartContract = this.contracts.get(address);
        if (!smartContract) return TransactionStatus.FAILED;
        const contract = structuredClone(smartContract);

        const transaction: BlockchainTransactionInterface = {
            address: contract.address,
            lt: Date.now(),
            now: Date.now(),
            outMessagesCount: 0,
            oldStatus: contract.status,
            endStatus: contract.status,
            inMsg: {
                type: BlockchainTransactionInMsgEnum.EXTERNAL,
                address: contract.address,
                status: TransactionStatus.FAILED,
                body: args.body,
            },
            outMsg: [],
            totalFees: messageCommission,
        };

        if (contract.status === ContractStatusEnum.UNINITIALIZED && stateInit) {
            const address = BlockchainUtils.getAddress(stateInit);
            if (address !== contract.address) return TransactionStatus.FAILED;
            transaction.inMsg.stateInit = stateInit;
            transaction.totalFees += storageCommission;
            contract.code = stateInit.code;
            contract.storage = stateInit.data;
            contract.status = ContractStatusEnum.ACTIVE;
            transaction.endStatus = ContractStatusEnum.ACTIVE;
        }

        (global as any).BaseContract = BaseContract;

        const workContract = this.getWorkContract(contract);

        if (workContract.outMsg) {
            const sendInnMsg = (args: BlockchainInnMsgInterface) => {
                let status = TransactionStatus.FAILED;
                const innMsgTotalFees = args.amount;

                if (
                    workContract.balance >=
                    transaction.totalFees + innMsgTotalFees + messageCommission + messageCommission
                ) {
                    transaction.totalFees += messageCommission;
                    workContract.balance -= innMsgTotalFees;
                    workContract.balance -= messageCommission;
                    status = TransactionStatus.SUCCESS;

                    newBlock.innerMessagesList.push({
                        address: args.address,
                        lt: Date.now(),
                        now: Date.now(),
                        outMessagesCount: 0,
                        oldStatus: workContract.status,
                        endStatus: workContract.status,
                        inMsg: {
                            type: BlockchainTransactionInMsgEnum.INTERNAL,
                            address: workContract.address,
                            status: TransactionStatus.SUCCESS,
                            bounce: args.bounce,
                            bounced: false,
                            body: args.body,
                            amount: args.amount,
                        },
                        outMsg: [],
                        totalFees: messageCommission,
                    });
                }

                transaction.outMessagesCount++;
                transaction.outMsg.push({
                    address: args.address,
                    bounce: args.bounce,
                    bounced: false,
                    body: args.body,
                    type: BlockchainTransactionInMsgEnum.INTERNAL,
                    status,
                    amount: args.amount,
                });

                return TransactionStatus.SUCCESS;
            };

            let accepted = false;
            const acceptMessage = () => {
                accepted = true;
            };

            const success = workContract.outMsg(args.body, { sendInnMsg, acceptMessage });
            if (success !== TransactionStatus.SUCCESS || !accepted) return TransactionStatus.FAILED;
        }

        workContract.balance -= transaction.totalFees;
        if (workContract.balance < 0) return TransactionStatus.FAILED;
        if (workContract.balance === 0) {
            workContract.status = ContractStatusEnum.FROZEN;
            transaction.endStatus = ContractStatusEnum.FROZEN;
        }

        transaction.inMsg.status = TransactionStatus.SUCCESS;
        newBlock.transactions.push(transaction);
        newBlock.setContract(workContract);

        this.save(newBlock);
        return TransactionStatus.SUCCESS;
    }

    public sendInnerMsg(inMsg: BlockchainTransactionInterface) {
        const transaction = structuredClone(inMsg);
        const newBlock = new Blockchain();
        if (transaction?.inMsg?.type !== BlockchainTransactionInMsgEnum.INTERNAL) return TransactionStatus.FAILED;

        transaction.lt = Date.now();
        transaction.now = Date.now();

        const contract = this.contracts.get(transaction.address);
        if (!contract) {
            if (transaction.inMsg.bounce === false) {
                const uninitializedContract = BlockchainUtils.createUninitializedContract(
                    transaction.address,
                    transaction.inMsg.amount,
                );
                newBlock.setContract(uninitializedContract);
                newBlock.transactions.push(transaction);
            } else {
                if (transaction.inMsg.amount >= messageCommission) {
                    transaction.address = inMsg.inMsg.address;
                    transaction.inMsg.address = inMsg.address;
                    transaction.inMsg.amount -= messageCommission;
                    transaction.inMsg.bounced = true;
                    transaction.inMsg.status = TransactionStatus.SUCCESS;
                    newBlock.innerMessagesList.push(transaction);
                }
            }
        } else {
            const workContract = contract?.code?.length ? this.getWorkContract(contract) : contract;
            const sendInnMsg = (args: BlockchainInnMsgInterface) => {
                if (
                    transaction.inMsg.type === BlockchainTransactionInMsgEnum.INTERNAL &&
                    transaction.inMsg.bounced === true
                ) {
                    if (workContract.onBounce) workContract.onBounce(transaction.inMsg.body);
                    return TransactionStatus.FAILED;
                }

                newBlock.innerMessagesList.push({
                    address: args.address,
                    lt: Date.now(),
                    now: Date.now(),
                    outMessagesCount: 0,
                    oldStatus: workContract.status,
                    endStatus: workContract.status,
                    inMsg: {
                        type: BlockchainTransactionInMsgEnum.INTERNAL,
                        address: workContract.address,
                        status: TransactionStatus.FAILED,
                        bounce: args.bounce,
                        bounced: false,
                        body: args.body,
                        amount: args.amount,
                    },
                    outMsg: [],
                    totalFees: messageCommission,
                });

                let status = TransactionStatus.FAILED;
                const innMsgTotalFees = args.amount;

                if (workContract.balance >= innMsgTotalFees) {
                    workContract.balance -= innMsgTotalFees;
                    transaction.totalFees += messageCommission;
                    status = TransactionStatus.SUCCESS;
                }

                transaction.outMessagesCount++;
                transaction.outMsg.push({
                    type: BlockchainTransactionInMsgEnum.INTERNAL,
                    address: args.address,
                    bounce: args.bounce,
                    body: args.body,
                    bounced: false,
                    status,
                    amount: args.amount,
                });

                return TransactionStatus.SUCCESS;
            };

            if (workContract.innMsg) {
                transaction.inMsg.status = workContract.innMsg(transaction.inMsg.body, { sendInnMsg });
            } else transaction.inMsg.status = TransactionStatus.SUCCESS;

            workContract.balance += transaction.inMsg.amount;
            newBlock.setContract(workContract);
            newBlock.transactions.push(transaction);
        }

        this.save(newBlock);
    }

    public setContract(contract: any) {
        const oldContract = this.contracts.get(contract.address);
        if (!oldContract) return this.contracts.set(contract.address, contract);

        oldContract.balance = contract.balance;
        oldContract.storage = contract.storage;
        oldContract.status = contract.status;
        oldContract.code = contract.code;

        this.contracts.set(oldContract.address, oldContract);
    }

    public toString() {
        return JSON.stringify(
            this,
            (_key, value) => {
                if (typeof value === 'bigint') return value.toString();
                if (value instanceof Map) return Object.fromEntries(value);
                return value;
            },
            2,
        );
    }

    public updateStorage() {
        let time = 1000;

        const inMsg = this.innerMessagesList?.length ? this.innerMessagesList[0] : null;
        if (inMsg) {
            time = 1000;
            this.innerMessagesList.shift();
            this.sendInnerMsg(inMsg);
        }

        fs.writeFileSync(path.join(__dirname, './storage.json'), this.toString(), 'utf8');
        setTimeout(() => this.updateStorage(), time);
    }

    private save(newBlock: BlockchainInterface) {
        const contracts = Array.from(newBlock.contracts.values());
        contracts.forEach((contract) => blockchain.setContract(contract));
        newBlock.transactions.forEach((transaction) => blockchain.transactions.push(transaction));
        newBlock.innerMessagesList.forEach((innerMessage) => blockchain.innerMessagesList.push(innerMessage));
    }

    private getWorkContract(contract: ContractInterface) {
        (global as any).BaseContract = BaseContract;
        const ContractClass = eval(`(${contract.code.replace('base_contract_1.', '')})`);
        const workContract = new ContractClass({ code: contract.code, data: {} });
        workContract.address = contract.address;
        workContract.balance = contract.balance;
        workContract.storage = contract.storage;
        workContract.status = contract.status;

        return workContract as ContractInterface;
    }

    public loadFromStorage() {
        const filePath = path.resolve(path.join(__dirname, './storage.json'));

        if (!fs.existsSync(filePath)) return;

        try {
            const rawData = fs.readFileSync(filePath, 'utf8');
            if (!rawData.trim()?.length) return;
            const savedData = JSON.parse(rawData);

            this.transactions = savedData.transactions || [];

            if (savedData.contracts) {
                const contractsObject = savedData.contracts;

                for (const [address, data] of Object.entries(contractsObject)) {
                    const contract = data as any;
                    this.contracts.set(address, contract);
                }
            }
        } catch (err) {
            console.error('Ошибка при загрузке storage.json:', err);
        }
    }
}

export const blockchain: BlockchainInterface = new Blockchain();
blockchain.loadFromStorage();
blockchain.updateStorage();
