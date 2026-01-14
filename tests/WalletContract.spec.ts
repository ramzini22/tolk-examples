import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';

import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { WalletContract } from '../wrappers/wallet/Wallet';
import { mnemonicToPrivateKey } from '@ton/crypto';

describe('Wallet', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('wallet/Wallet');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let wallet: SandboxContract<WalletContract>;

    beforeEach(async () => {
        const words = ['1', '2', '3'];
        const { publicKey } = await mnemonicToPrivateKey(words);
        const subwallet_id = Number(process.env.SUBWALLET_ID ?? 0);
        blockchain = await Blockchain.create();

        wallet = blockchain.openContract(WalletContract.createFromConfig({ publicKey, subwallet_id }, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await wallet.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: wallet.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and firstContract are ready to use
    });
});
