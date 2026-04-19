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
import { BlockchainTransactionOutMsgInterface } from './interfaces/blockchain-transaction-out-msg.interface';

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
        const { address, stateInit, body } = args;
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
                address: contract.address,
                type: BlockchainTransactionInMsgEnum.EXTERNAL,
                status: TransactionStatus.FAILED,
                stateInit,
                body,
            },
            outMsg: [],
            totalFees: 0,
        };

        if (contract.status === ContractStatusEnum.UNINITIALIZED && stateInit) {
            const address = BlockchainUtils.getAddress(stateInit);
            if (address !== contract.address) return TransactionStatus.FAILED;
            transaction.inMsg.stateInit = stateInit;
            transaction.totalFees += storageCommission;
            contract.balance -= storageCommission;
            contract.code = stateInit.code;
            contract.storage = stateInit.data;
        }

        (global as any).BaseContract = BaseContract;

        const workContract = this.getWorkContract(contract);
        if (!workContract) return TransactionStatus.FAILED;

        if (workContract.outMsg) {
            transaction.totalFees += messageCommission;
            workContract.balance -= messageCommission;

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
                            address: workContract.address,
                            bounce: args.bounce,
                            bounced: false,
                            type: BlockchainTransactionInMsgEnum.INTERNAL,
                            status: TransactionStatus.SUCCESS,
                            amount: args.amount,
                            stateInit: args.stateInit,
                            body: args.body,
                        },
                        outMsg: [],
                        totalFees: 0,
                    });
                }

                transaction.outMessagesCount++;
                transaction.outMsg.push({
                    address: args.address,
                    bounce: args.bounce,
                    bounced: false,
                    type: BlockchainTransactionInMsgEnum.INTERNAL,
                    status,
                    amount: args.amount,
                    stateInit: args.stateInit,
                    body: args.body,
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

        if (workContract.balance < 0) return TransactionStatus.FAILED;

        transaction.inMsg.status = TransactionStatus.SUCCESS;
        newBlock.transactions.push(transaction);
        newBlock.setContract(workContract);

        this.save(newBlock);
        return TransactionStatus.SUCCESS;
    }

    public sendInnerMsg(inMsg: BlockchainTransactionInterface<BlockchainTransactionOutMsgInterface>) {
        const transaction = structuredClone(inMsg);
        const newBlock = new Blockchain();

        transaction.lt = Date.now();
        transaction.now = Date.now();

        let contract = this.contracts.get(transaction.address);
        if (
            !contract?.code?.length &&
            inMsg.inMsg.stateInit &&
            inMsg.inMsg.amount >= storageCommission + messageCommission
        ) {
            if (contract) {
                contract.code = inMsg.inMsg.stateInit.code;
                contract.storage = inMsg.inMsg.stateInit.data;
            } else {
                contract = new BaseContract({ code: inMsg.inMsg.stateInit.code, data: inMsg.inMsg.stateInit.data });
            }

            contract.balance += transaction.inMsg.amount;
            transaction.totalFees += storageCommission;
            contract.balance -= storageCommission;
            newBlock.setContract(contract);
        } else if (contract) {
            contract.balance += transaction.inMsg.amount;
        }

        if (!contract) {
            if (transaction.inMsg.amount < messageCommission) return TransactionStatus.FAILED;
            if (transaction.inMsg.bounce === false) {
                const uninitializedContract = BlockchainUtils.createUninitializedContract(
                    transaction.address,
                    transaction.inMsg.amount,
                );
                transaction.totalFees += messageCommission;
                uninitializedContract.balance -= messageCommission;
                newBlock.setContract(uninitializedContract);
                newBlock.transactions.push(transaction);
            } else {
                transaction.address = inMsg.inMsg.address;
                transaction.inMsg.address = inMsg.address;
                transaction.inMsg.amount -= messageCommission;
                transaction.inMsg.bounced = true;
                transaction.inMsg.status = TransactionStatus.SUCCESS;
                newBlock.innerMessagesList.push(transaction);
            }
        } else if (contract.balance >= messageCommission) {
            const workContract = contract?.code?.length ? this.getWorkContract(contract) : contract;
            if (!workContract) return TransactionStatus.FAILED;

            transaction.totalFees += messageCommission;
            workContract.balance -= messageCommission;

            const sendInnMsg = (args: BlockchainInnMsgInterface) => {
                let status = TransactionStatus.FAILED;
                const innMsgTotalFees = args.amount;

                if (workContract.balance >= innMsgTotalFees + messageCommission) {
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
                            address: workContract.address,
                            bounce: args.bounce,
                            bounced: false,
                            type: BlockchainTransactionInMsgEnum.INTERNAL,
                            status: TransactionStatus.SUCCESS,
                            amount: args.amount,
                            stateInit: args.stateInit,
                            body: args.body,
                        },
                        outMsg: [],
                        totalFees: 0,
                    });
                }

                transaction.outMessagesCount++;
                transaction.outMsg.push({
                    address: args.address,
                    bounce: args.bounce,
                    bounced: false,
                    type: BlockchainTransactionInMsgEnum.INTERNAL,
                    status,
                    amount: args.amount,
                    stateInit: args.stateInit,
                    body: args.body,
                });

                return TransactionStatus.SUCCESS;
            };

            if (workContract.innMsg) {
                transaction.inMsg.status = workContract.innMsg(
                    {
                        address: transaction.inMsg.address,
                        bounce: transaction.inMsg.bounce,
                        amount: transaction.inMsg.amount,
                        stateInit: transaction.inMsg.stateInit,
                        body: transaction.inMsg.body,
                    },
                    { sendInnMsg },
                );
            } else transaction.inMsg.status = TransactionStatus.SUCCESS;

            newBlock.setContract(workContract);
            newBlock.transactions.push(transaction);
        }

        this.save(newBlock);
    }

    public setContract(contract: ContractInterface) {
        let oldContract = this.contracts.get(contract.address);
        if (!oldContract) oldContract = contract;
        else {
            oldContract.storage = contract.storage;
            oldContract.balance = contract.balance;
            if (!oldContract.code?.length) oldContract.code = contract.code;
        }

        if (oldContract.code) {
            if (contract.balance > 0) oldContract.status = ContractStatusEnum.ACTIVE;
            else oldContract.status = ContractStatusEnum.FROZEN;
        } else oldContract.status = ContractStatusEnum.UNINITIALIZED;

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

    public async updateStorage() {
        return new Promise<void>((resolve) => {
            let time = 10;

            const inMsg = this.innerMessagesList?.length ? this.innerMessagesList[0] : null;
            if (inMsg) {
                time = 1;
                this.innerMessagesList.shift();
                this.sendInnerMsg(inMsg);
            }
            fs.writeFileSync(path.join(__dirname, './storage.json'), this.toString(), 'utf8');
            setTimeout(() => this.updateStorage(), time);
            return resolve();
        });
    }

    private save(newBlock: BlockchainInterface) {
        const contracts = Array.from(newBlock.contracts.values());
        contracts.forEach((contract) => {
            blockchain.setContract(contract);
            newBlock.transactions = newBlock.transactions.map((transaction) => {
                if (transaction.address === contract.address) transaction.endStatus = contract.status;
                return transaction;
            });
        });
        newBlock.transactions.forEach((transaction) => blockchain.transactions.push(transaction));
        newBlock.innerMessagesList.forEach((innerMessage) => blockchain.innerMessagesList.push(innerMessage));
    }

    private getWorkContract(contract: ContractInterface) {
        try {
            if (!contract.code) {
                console.error('Contract.code is empty');
                return null;
            }
            (global as any).BaseContract = BaseContract;
            const ContractClass = eval(`(${contract.code.replace('base_contract_1.', '')})`);
            const workContract = new ContractClass({ code: contract.code, data: {} });
            workContract.address = contract.address;
            workContract.balance = contract.balance;
            workContract.storage = contract.storage;
            workContract.status = contract.status;
            return workContract as ContractInterface;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    public async loadFromStorage() {
        return new Promise<void>((resolve) => {
            const filePath = path.resolve(path.join(__dirname, './storage.json'));

            if (!fs.existsSync(filePath)) {
                blockchain.updateStorage();
                return resolve();
            }

            try {
                const rawData = fs.readFileSync(filePath, 'utf8');
                if (!rawData.trim()?.length) {
                    blockchain.updateStorage();
                    return resolve();
                }

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

            blockchain.updateStorage();
            return resolve();
        });
    }
}

export const blockchain: BlockchainInterface = new Blockchain();
