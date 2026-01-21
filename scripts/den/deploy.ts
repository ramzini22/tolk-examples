import { Address, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { DenContract } from '../../wrappers/den-contract';

export async function run(provider: NetworkProvider) {
    const seller: Address = Address.parse('0QD5I9yyyHZ6K3MpzXdjiOQiYud0oaQt8Ehfgo4zerKRLKPR');
    const bayer: Address = Address.parse('0QD5I9yyyHZ6K3MpzXdjiOQiYud0oaQt8Ehfgo4zerKRLKPR');
    const arbitrator: Address = Address.parse('0QD5I9yyyHZ6K3MpzXdjiOQiYud0oaQt8Ehfgo4zerKRLKPR');
    const dealHash = '24f6cb2ce3510c3b24f6cb2ce3510c3b24f6cb2ce3510c3b24f6cb2ce3510c3b';
    const amount = toNano('0.5');

    const denContractWrapper = await DenContract.createFromConfig({
        seller,
        bayer,
        arbitrator,
        amount,
        dealHash,
    });

    const denContract = provider.open(denContractWrapper);
    await denContract.sendDeploy(provider.sender(), toNano('0.05'));
    await provider.waitForDeploy(denContractWrapper.address);
}
