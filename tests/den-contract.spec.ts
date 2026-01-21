import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { DealContractStatus, DenContract } from '../wrappers/den-contract';
import { toNano } from '@ton/core';
import '@ton/test-utils';

const numericFolder = 'den-contract';

describe(numericFolder, () => {
    let blockchain: Blockchain;
    let seller: SandboxContract<TreasuryContract>;
    let bayer: SandboxContract<TreasuryContract>;
    let arbitrator: SandboxContract<TreasuryContract>;
    let denContract: SandboxContract<DenContract>;
    let amount: bigint;
    let dealHash: string;

    beforeAll(async () => {
        blockchain = await Blockchain.create();
        seller = await blockchain.treasury('seller');
        bayer = await blockchain.treasury('bayer');
        arbitrator = await blockchain.treasury('arbitrator');
        dealHash = '24f6cb2ce3510c3b24f6cb2ce3510c3b24f6cb2ce3510c3b24f6cb2ce3510c3b';
        amount = toNano(String(Math.floor(Math.random() * 10) + 1));

        denContract = blockchain.openContract(
            await DenContract.createFromConfig({
                seller: seller.address,
                bayer: bayer.address,
                arbitrator: arbitrator.address,
                amount,
                dealHash,
            }),
        );
    });

    it('should deploy', async () => {
        const deployResult = await denContract.sendDeploy(bayer.getSender(), toNano('100'));
        expect(deployResult.transactions).toHaveTransaction({
            from: bayer.address,
            to: denContract.address,
            deploy: true,
        });
    });

    it('should be deployed', async () => {
        const deployResult = await denContract.sendDeploy(bayer.getSender(), toNano('100'));
        expect(deployResult.transactions).toHaveTransaction({
            from: bayer.address,
            to: denContract.address,
            deploy: false,
        });
    });

    it('should have valid contractStorage', async () => {
        const contractStorage = await denContract.getContractStorage();

        expect(contractStorage).not.toBe(0n);
        if (contractStorage === 0n) return;

        expect(seller.address.toString()).toBe(contractStorage.seller.toString());
        expect(bayer.address.toString()).toBe(contractStorage.bayer.toString());
        expect(arbitrator.address.toString()).toBe(contractStorage.arbitrator.toString());
    });

    it('should have valid getDealStorage', async () => {
        const dealStorage = await denContract.getDealStorage();

        expect(dealStorage).not.toBe(0n);
        if (dealStorage === 0n) return;

        expect(dealStorage.dealHash).toBe(dealHash);
        expect(dealStorage.amount).toBe(amount);
        expect(dealStorage.status).toBe(DealContractStatus.Created);
    });
});
